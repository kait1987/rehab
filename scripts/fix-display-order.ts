import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 현재 displayOrder 상태 확인...\n");

  // 1. BodyPart 현재 상태
  const bodyParts = await prisma.bodyPart.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    select: { id: true, name: true, displayOrder: true },
  });

  console.log("📋 BodyParts (현재 순서):");
  bodyParts.forEach((bp, i) =>
    console.log(`  ${i + 1}. ${bp.name} (order: ${bp.displayOrder})`),
  );

  // 2. EquipmentType 현재 상태
  const equipmentTypes = await prisma.equipmentType.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    select: { id: true, name: true, displayOrder: true },
  });

  console.log("\n📋 EquipmentTypes (현재 순서):");
  equipmentTypes.forEach((eq, i) =>
    console.log(`  ${i + 1}. ${eq.name} (order: ${eq.displayOrder})`),
  );

  // 3. 원하는 순서 정의

  // 해부학적 순서 (머리 → 발)
  const desiredBodyPartOrder = [
    "목", // 1
    "어깨", // 2
    "등", // 3
    "가슴", // 4
    "팔", // 5
    "팔꿈치", // 6
    "손목", // 7
    "허리", // 8
    "골반", // 9
    "다리", // 10
    "무릎", // 11
    "발목", // 12
  ];

  // 기구 순서 (없음 맨 위, 나머지 사용 빈도순)
  const desiredEquipmentOrder = [
    "없음", // 0 (맨 위!)
    "매트", // 1
    "밴드", // 2
    "덤벨", // 3
    "폼롤러", // 4
    "마사지볼", // 5
    "의자", // 6
    "아령", // 7
    "짐볼", // 8
    "수건", // 9
    "물병", // 10
  ];

  console.log("\n🔧 displayOrder 업데이트 중...");

  // 4. BodyPart displayOrder 업데이트
  for (let i = 0; i < desiredBodyPartOrder.length; i++) {
    const name = desiredBodyPartOrder[i];
    await prisma.bodyPart.updateMany({
      where: { name },
      data: { displayOrder: i + 1 },
    });
  }
  console.log("✅ BodyParts displayOrder 업데이트 완료");

  // 5. EquipmentType displayOrder 업데이트
  for (let i = 0; i < desiredEquipmentOrder.length; i++) {
    const name = desiredEquipmentOrder[i];
    await prisma.equipmentType.updateMany({
      where: { name },
      data: { displayOrder: i }, // 없음은 0
    });
  }
  console.log("✅ EquipmentTypes displayOrder 업데이트 완료");

  // 6. 결과 확인
  console.log("\n📋 업데이트 후 BodyParts:");
  const updatedBodyParts = await prisma.bodyPart.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    select: { name: true, displayOrder: true },
  });
  updatedBodyParts.forEach((bp, i) =>
    console.log(`  ${i + 1}. ${bp.name} (order: ${bp.displayOrder})`),
  );

  console.log("\n📋 업데이트 후 EquipmentTypes:");
  const updatedEquipment = await prisma.equipmentType.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    select: { name: true, displayOrder: true },
  });
  updatedEquipment.forEach((eq, i) =>
    console.log(`  ${i + 1}. ${eq.name} (order: ${eq.displayOrder})`),
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
