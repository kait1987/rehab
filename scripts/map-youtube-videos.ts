/**
 * @file map-youtube-videos.ts
 * @description YouTube Data API v3를 사용하여 운동 템플릿에 영상 ID 매핑
 *
 * 사용법:
 *   npm run map:youtube-videos
 *
 * 환경변수 (.env.local):
 *   - YOUTUBE_API_KEY: YouTube Data API v3 키 (Google Cloud Console에서 발급)
 *   - DATABASE_URL: Supabase PostgreSQL 연결 문자열
 */

import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { PrismaClient } from "@prisma/client";
import fetchOrig from "node-fetch";
const fetch = fetchOrig as unknown as typeof globalThis.fetch;

const prisma = new PrismaClient();

// ====== 환경변수 ======
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";
const DELAY_MS = Number(process.env.YOUTUBE_DELAY_MS || 500);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL 환경변수가 없습니다 (.env.local 확인)");
}
if (!YOUTUBE_API_KEY) {
  throw new Error("YOUTUBE_API_KEY 환경변수가 없습니다 (.env.local 확인)");
}

interface YouTubeSearchItem {
  id: {
    kind: string;
    videoId?: string;
  };
  snippet: {
    title: string;
    channelTitle: string;
  };
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
  error?: {
    code: number;
    message: string;
  };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * 검색 쿼리 후보 생성
 */
function makeQueryCandidates(exerciseName: string): string[] {
  return [
    `${exerciseName} 운동 방법`,
    `${exerciseName} 자세`,
    `${exerciseName} exercise form`,
    `${exerciseName} 재활 운동`,
    exerciseName,
  ];
}

/**
 * YouTube Data API v3 Search 호출
 */
async function searchYouTube(query: string): Promise<string | null> {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "1");
  url.searchParams.set("q", query);
  url.searchParams.set("key", YOUTUBE_API_KEY);

  try {
    const res = await fetch(url.toString(), { method: "GET" });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`    [HTTP ${res.status}] ${text.slice(0, 120)}`);
      return null;
    }

    const data = (await res.json()) as YouTubeSearchResponse;

    if (data.error) {
      console.error(`    [API Error] ${data.error.message}`);
      return null;
    }

    if (data.items && data.items.length > 0) {
      const videoId = data.items[0].id.videoId;
      if (videoId) {
        console.log(`    [Found] ${data.items[0].snippet.title.slice(0, 50)}...`);
        return videoId;
      }
    }

    return null;
  } catch (error) {
    console.error(`    [Fetch Error]`, error);
    return null;
  }
}

/**
 * 운동 하나에 대해 YouTube 검색 시도
 */
async function resolveOne(exerciseName: string): Promise<string | null> {
  const candidates = makeQueryCandidates(exerciseName);

  for (const query of candidates) {
    console.log(`    검색: "${query}"`);
    const videoId = await searchYouTube(query);

    if (videoId) {
      return videoId;
    }

    await sleep(300); // 후보 간 딜레이
  }

  return null;
}

/**
 * 메인 실행
 */
async function main() {
  console.log("=".repeat(60));
  console.log("YouTube 영상 매핑 스크립트");
  console.log("=".repeat(60));

  console.log(`\n📋 환경변수 상태:`);
  console.log(`   DATABASE_URL: ✓ 설정됨`);
  console.log(`   YOUTUBE_API_KEY: ✓ 설정됨 (${YOUTUBE_API_KEY.substring(0, 10)}...)`);

  // video_url이 없는 운동만 가져오기
  const targets = await prisma.exerciseTemplate.findMany({
    where: { videoUrl: null },
    select: { id: true, name: true },
  });

  console.log(`\n대상 운동: ${targets.length}개\n`);

  const success: Array<{ name: string; videoId: string }> = [];
  const failed: Array<{ name: string }> = [];

  for (const t of targets) {
    console.log(`\n- ${t.name}`);

    const videoId = await resolveOne(t.name);

    if (videoId) {
      await prisma.exerciseTemplate.update({
        where: { id: t.id },
        data: { videoUrl: videoId },
      });
      success.push({ name: t.name, videoId });
      console.log(`  ✓ video_url 저장: ${videoId}`);
    } else {
      failed.push({ name: t.name });
      console.log(`  ✗ 실패 (검색 결과 없음)`);
    }

    await sleep(DELAY_MS);
  }

  // 결과 요약
  console.log("\n" + "=".repeat(60));
  console.log("결과 요약");
  console.log("=".repeat(60));
  console.log(`성공: ${success.length}개`);
  console.log(`실패: ${failed.length}개`);

  if (failed.length > 0 && failed.length <= 20) {
    console.log("\n실패 목록:");
    failed.forEach((x) => console.log(`  - ${x.name}`));
  } else if (failed.length > 20) {
    console.log(`\n실패 목록 (상위 20개):`);
    failed.slice(0, 20).forEach((x) => console.log(`  - ${x.name}`));
    console.log(`  ... 외 ${failed.length - 20}개`);
  }

  // 현재 상태
  const total = await prisma.exerciseTemplate.count();
  const withVideo = await prisma.exerciseTemplate.count({
    where: { videoUrl: { not: null } },
  });
  console.log(`\n현재 video_url 상태: ${withVideo}/${total}개`);
}

main()
  .catch((e) => {
    console.error("❌ Fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
