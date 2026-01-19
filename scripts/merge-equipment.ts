import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * '없음' 기구를 '맨몸'으로 병합하는 스크립트
 *
 * 1. '없음'과 '맨몸' 기구 ID를 찾음
 * 2. '없음'을 참조하는 모든 매핑을 '맨몸'으로 업데이트
 * 3. '없음' 기구 레코드 삭제
 */
async function main() {
  console.log("🔧 '없음' → '맨몸' 병합 중...\n");

  // 1. 기구 조회
  const noneEquipment = await prisma.equipmentType.findFirst({
    where: { name: "없음" },
  });

  const bodyweightEquipment = await prisma.equipmentType.findFirst({
    where: { name: "맨몸" },
  });

  console.log("현재 상태:");
  console.log(
    `  - '없음': ${noneEquipment ? `ID ${noneEquipment.id}` : "없음"}`,
  );
  console.log(
    `  - '맨몸': ${bodyweightEquipment ? `ID ${bodyweightEquipment.id}` : "없음"}`,
  );

  if (!noneEquipment) {
    console.log("\n✅ '없음' 기구가 이미 삭제되어 있습니다.");
    return;
  }

  if (!bodyweightEquipment) {
    // '맨몸'이 없으면 '없음'을 '맨몸'으로 이름 변경
    console.log(
      "\n'맨몸' 기구가 없습니다. '없음'을 '맨몸'으로 이름 변경합니다.",
    );
    await prisma.equipmentType.update({
      where: { id: noneEquipment.id },
      data: { name: "맨몸" },
    });
    console.log("✅ 완료!");
    return;
  }

  // 2. '없음'을 참조하는 매핑을 '맨몸'으로 업데이트
  console.log("\n매핑 업데이트 중...");

  // exercise_equipment_mapping 테이블 업데이트
  const mappingResult = await prisma.exerciseEquipmentMapping.updateMany({
    where: { equipmentTypeId: noneEquipment.id },
    data: { equipmentTypeId: bodyweightEquipment.id },
  });
  console.log(
    `  - exercise_equipment_mapping: ${mappingResult.count}개 업데이트`,
  );

  // 3. '없음' 기구 삭제
  console.log("\n'없음' 기구 삭제 중...");
  await prisma.equipmentType.delete({
    where: { id: noneEquipment.id },
  });

  console.log("\n✅ 병합 완료!");

  // 4. 결과 확인
  const finalEquipment = await prisma.equipmentType.findMany({
    orderBy: { displayOrder: "asc" },
  });
  console.log("\n최종 기구 목록:");
  finalEquipment.forEach((eq) => {
    console.log(`  - ${eq.name} (ID: ${eq.id})`);
  });
}

main()
  .catch((e) => {
    console.error("❌ 오류 발생:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
