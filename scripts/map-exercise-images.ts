import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { PrismaClient } from "@prisma/client";
import fetchOrig from "node-fetch";
const fetch = fetchOrig as unknown as typeof globalThis.fetch;

const prisma = new PrismaClient();

const API_HOST = process.env.EXERCISE_DB_API_HOST || "exercisedb.p.rapidapi.com";
const API_KEY = process.env.EXERCISE_DB_API_KEY || "";
const DELAY_MS = Number(process.env.EXERCISE_DB_DELAY_MS || 700);
const MAX_TRIES_PER_EXERCISE = Number(process.env.EXERCISE_DB_MAX_TRIES || 12);

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL 환경변수가 없습니다 (.env.local 확인)");
if (!API_KEY) throw new Error("EXERCISE_DB_API_KEY 환경변수가 없습니다 (.env.local 확인)");

type ExerciseDBItem = {
  id: string;
  name: string;
  gifUrl?: string;
  bodyPart?: string;
  target?: string;
  equipment?: string;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function makeCandidates(input: string): string[] {
  const base = normalize(input);
  const parts = base.split(" ").filter(Boolean);

  const candidates = new Set<string>();
  candidates.add(base);
  candidates.add(base.replace(/-/g, " "));
  candidates.add(base.replace(/\s/g, "-"));

  const prefixes = ["dumbbell", "barbell", "cable", "band", "bodyweight", "standing", "seated", "lying"];
  for (const p of prefixes) candidates.add(`${p} ${base}`.trim());

  if (parts.length >= 2) {
    candidates.add(parts.slice(0, 2).join(" "));
    candidates.add(parts.slice(-2).join(" "));
  }

  return Array.from(candidates)
    .filter((x) => x.length >= 4 && x.length <= 60)
    .slice(0, MAX_TRIES_PER_EXERCISE);
}

async function fetchByName(q: string): Promise<ExerciseDBItem[] | null> {
  const url = `https://${API_HOST}/exercises/name/${encodeURIComponent(q)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": API_KEY,
      "X-RapidAPI-Host": API_HOST,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`    [HTTP ${res.status}] ${res.statusText}: ${text.slice(0, 120)}`);
    return null;
  }

  const data = (await res.json().catch(() => null)) as unknown;
  if (Array.isArray(data)) return data as ExerciseDBItem[];
  if (data) return [data as ExerciseDBItem];
  return [];
}

function pickBest(items: ExerciseDBItem[], originalQuery: string): ExerciseDBItem | null {
  if (!items.length) return null;

  const withGif = items.filter((x) => x.gifUrl);
  const nq = normalize(originalQuery);

  const score = (name: string) => {
    const nn = normalize(name);
    let s = 0;
    if (nn === nq) s += 100;
    if (nn.includes(nq)) s += 40;
    if (nq.includes(nn)) s += 10;
    return s;
  };

  const pool = (withGif.length ? withGif : items).slice();
  pool.sort((a, b) => score(b.name) - score(a.name));
  return pool[0] ?? null;
}

async function resolveOne(englishName: string) {
  const candidates = makeCandidates(englishName);

  for (const c of candidates) {
    const items = await fetchByName(c);
    if (!items) {
      await sleep(200);
      continue;
    }

    const best = pickBest(items, englishName);
    if (best?.gifUrl) {
      return { best, usedQuery: c };
    }

    await sleep(200);
  }

  return null;
}

async function main() {
  console.log("=".repeat(60));
  console.log("GIF 매핑 v2 (english_name 자동 교정 포함)");
  console.log("=".repeat(60));

  const targets = await prisma.exerciseTemplate.findMany({
    where: { englishName: { not: null }, gifUrl: null },
    select: { id: true, name: true, englishName: true },
  });

  console.log(`대상: ${targets.length}개`);

  const success: Array<{ name: string; englishName: string; fixedName?: string }> = [];
  const failed: Array<{ name: string; englishName: string }> = [];

  for (const t of targets) {
    const englishName = t.englishName!.trim();
    console.log(`\n- ${t.name} | english="${englishName}"`);

    const resolved = await resolveOne(englishName);

    if (resolved?.best?.gifUrl) {
      await prisma.exerciseTemplate.update({
        where: { id: t.id },
        data: { gifUrl: resolved.best.gifUrl },
      });

      const fixedName = normalize(resolved.best.name);
      if (fixedName && fixedName !== normalize(englishName)) {
        await prisma.exerciseTemplate.update({
          where: { id: t.id },
          data: { englishName: fixedName },
        });
        console.log(`  ✓ englishName 교정: "${englishName}" -> "${fixedName}"`);
      }

      console.log(`  ✓ gifUrl 저장 완료: ${resolved.best.gifUrl.slice(0, 80)}...`);
      success.push({ name: t.name, englishName, fixedName });
    } else {
      console.log(`  ✗ 실패 (후보 ${makeCandidates(englishName).length}개 시도)`);
      failed.push({ name: t.name, englishName });
    }

    await sleep(DELAY_MS);
  }

  console.log("\n" + "=".repeat(60));
  console.log(`성공: ${success.length}개`);
  console.log(`실패: ${failed.length}개`);

  if (failed.length) {
    console.log("\n실패 목록(englishName 보강 필요):");
    failed.slice(0, 50).forEach((x) => console.log(`- ${x.name} | ${x.englishName}`));
    if (failed.length > 50) console.log(`... 외 ${failed.length - 50}개`);
  }

  const total = await prisma.exerciseTemplate.count();
  const withGif = await prisma.exerciseTemplate.count({ where: { gifUrl: { not: null } } });
  console.log(`\n현재 GIF 상태: ${withGif}/${total}`);
}

main()
  .catch((e) => {
    console.error("❌ Fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
