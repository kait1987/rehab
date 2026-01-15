import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 '없음' → '맨몸' 이름 변경 중...");

  // 1. 현재 상태 확인
  const before = await prisma.equipmentType.findFirst({
    where: { name: "없음" },
  });

  if (!before) {
    // 이미 변경되었거나 없는 경우
    const existing = await prisma.equipmentType.findFirst({
      where: { name: "맨몸" },
    });
    if (existing) {
      console.log("✅ 이미 '맨몸'으로 설정되어 있습니다.");
      return;
    }
    console.log("❌ '없음' 기구를 찾을 수 없습니다.");
    return;
  }

  console.log(`현재: ${before.name} (ID: ${before.id})`);

  // 2. 이름 변경
  await prisma.equipmentType.update({
    where: { id: before.id },
    data: { name: "맨몸" },
  });

  // 3. 결과 확인
  const after = await prisma.equipmentType.findUnique({
    where: { id: before.id },
  });

  console.log(`변경 후: ${after?.name}`);
  console.log("✅ 완료!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
