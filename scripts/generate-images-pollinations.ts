import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 생성할 이미지 스타일 프롬프트
const STYLE_PROMPT =
  "minimalist flat vector illustration, scientific medical drawing style, clean white background, soft blue and grey colors, high quality";

async function main() {
  console.log("Generating AI images using Pollinations.ai...\n");

  // imageUrl이 없는 운동 찾기
  const exercises = await prisma.exerciseTemplate.findMany({
    where: {
      englishName: { not: null },
      imageUrl: null,
    },
    select: { id: true, name: true, englishName: true },
  });

  console.log(`Found ${exercises.length} exercises without images.`);

  for (const ex of exercises) {
    if (!ex.englishName) continue;

    // 프롬프트 구성
    const prompt = `${ex.englishName} exercise, ${STYLE_PROMPT}`;
    const encodedPrompt = encodeURIComponent(prompt);

    // 시드(Seed)를 운동 ID 기반으로 고정하여 항상 같은 이미지가 나오도록 함
    // (간단히 ID의 일부 문자를 숫자로 변환하거나, 랜덤하지만 고정된 값을 사용)
    const seed = Math.floor(Math.random() * 1000000);

    // Pollinations URL 생성
    const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=800&height=600&seed=${seed}&nologo=true`;

    // DB 업데이트
    await prisma.exerciseTemplate.update({
      where: { id: ex.id },
      data: { imageUrl: imageUrl },
    });

    console.log(`✅ Linked: ${ex.name} (${ex.englishName})`);
  }

  // 결과 확인
  const total = await prisma.exerciseTemplate.count();
  const withImage = await prisma.exerciseTemplate.count({
    where: { imageUrl: { not: null } },
  });

  console.log(`\n🎉 Image Generation Complete!`);
  console.log(
    `Total Coverage: ${withImage}/${total} (${((withImage / total) * 100).toFixed(1)}%)`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
