import { PrismaClient } from "@prisma/client";
import fetchOrig from "node-fetch";
const fetch = fetchOrig as unknown as typeof globalThis.fetch;

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Verifying Image Integration...\n");

  const count = await prisma.exerciseTemplate.count({
    where: { imageUrl: { not: null } },
  });
  const total = await prisma.exerciseTemplate.count();

  console.log(`📊 Stats: ${count} / ${total} exercises have images linked.\n`);

  // 샘플 5개 조회
  const samples = await prisma.exerciseTemplate.findMany({
    where: { imageUrl: { not: null } },
    take: 5,
    select: { name: true, englishName: true, imageUrl: true },
  });

  console.log("📸 Random Samples Check:");
  for (const s of samples) {
    if (!s.imageUrl) continue;

    console.log(`\n- Exercise: ${s.name} (${s.englishName})`);
    console.log(`  URL: ${s.imageUrl.substring(0, 60)}...`);

    try {
      const res = await fetch(s.imageUrl, { method: "HEAD" });
      if (res.ok) {
        console.log(`  ✅ Status: ${res.status} OK (Accessible)`);
      } else {
        console.log(`  ❌ Status: ${res.status} (Check URL)`);
      }
    } catch (e) {
      console.log(`  ❌ Error accessing URL: ${e}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
