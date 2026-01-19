import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("📊 Exercise Data Status Report\n");

  const total = await prisma.exerciseTemplate.count();
  const withEnglishName = await prisma.exerciseTemplate.count({
    where: { englishName: { not: null } },
  });
  const withGif = await prisma.exerciseTemplate.count({
    where: { gifUrl: { not: null } },
  });
  const withVideo = await prisma.exerciseTemplate.count({
    where: { videoUrl: { not: null } },
  });
  const withImage = await prisma.exerciseTemplate.count({
    where: { imageUrl: { not: null } },
  });

  console.log(`Total Exercises: ${total}`);
  console.log(
    `With English Name: ${withEnglishName} (${((withEnglishName / total) * 100).toFixed(1)}%)`,
  );
  console.log(
    `With GIF URL:      ${withGif} (${((withGif / total) * 100).toFixed(1)}%)`,
  );
  console.log(
    `With Video URL:    ${withVideo} (${((withVideo / total) * 100).toFixed(1)}%)`,
  );
  console.log(
    `With Image URL:    ${withImage} (${((withImage / total) * 100).toFixed(1)}%)`,
  );

  if (withEnglishName === 0) {
    console.log(
      "\n⚠️  No English names found. The media mapping scripts require English names to function.",
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
