const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 중복된 장비 및 미사용 장비 정리 스크립트
 * - "아령"은 "덤벨"과 같은 의미이므로 삭제
 */
async function main() {
  console.log("🧹 불필요한 장비 데이터 정리 시작...\n");

  // 삭제할 장비 목록 (중복 또는 미구현)
  const toDelete = ["아령"];

  for (const name of toDelete) {
    try {
      const deleted = await prisma.equipmentType.deleteMany({
        where: { name },
      });
      if (deleted.count > 0) {
        console.log(`✅ "${name}" 삭제됨`);
      } else {
        console.log(`⏭️ "${name}" - 이미 없음 (skip)`);
      }
    } catch (e) {
      console.log(`⚠️ "${name}" 삭제 실패:`, e.message);
    }
  }

  // 현재 장비 목록 출력
  const remaining = await prisma.equipmentType.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    select: { name: true, displayOrder: true },
  });

  console.log("\n📋 현재 활성화된 장비 목록:");
  remaining.forEach((eq, i) => {
    console.log(`   ${i + 1}. ${eq.name}`);
  });

  console.log("\n🎉 정리 완료!");
}

main()
  .catch((e) => {
    console.error("❌ 오류:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
