import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function deriveDifficulty(intensityLevel: number | null | undefined) {
  if (intensityLevel == null) return 3;
  switch (intensityLevel) {
    case 1:
      return 2;
    case 2:
      return 4;
    case 3:
      return 6;
    case 4:
      return 8;
    default:
      // 코드 상 5가 들어올 가능성이 있으므로 안전장치
      return 6;
  }
}

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const targets = await prisma.exerciseTemplate.findMany({
    where: { difficultyScore: null },
    select: { id: true, intensityLevel: true },
  });

  console.log(`NULL difficultyScore targets: ${targets.length}`);

  const updates = targets.map((e) =>
    prisma.exerciseTemplate.update({
      where: { id: e.id },
      data: { difficultyScore: deriveDifficulty(e.intensityLevel) },
    }),
  );

  for (const batch of chunk(updates, 300)) {
    await prisma.$transaction(batch);
  }

  const remaining = await prisma.exerciseTemplate.count({
    where: { difficultyScore: null },
  });
  console.log(`Remaining NULL difficultyScore: ${remaining}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
