const { PrismaClient } = require("@prisma/client");
const { readFileSync, writeFileSync } = require("fs");
const { join } = require("path");

const prisma = new PrismaClient();
const TEMPLATES_FILE = join(
  process.cwd(),
  "templates",
  "exercise-templates-real.json",
);

const nameMapping = {
  "레비테이터 스트레칭": "견갑거근 스트레칭 (Levator Scapulae)",
  "SCM 스트레칭": "흉쇄유돌근 스트레칭 (SCM)",
  "VMO 스트렝스닝": "내측광근 강화 운동 (VMO)",
  "친 턱": "턱 당기기 (Chin Tuck)",
  "친 턱 (턱 당기기)": "턱 당기기 (Chin Tuck)",
  "발목 도르시플렉션": "발목 당기기 (Dorsiflexion)",
  "발목 플렌터플렉션": "발목 밀기 (Plantarflexion)",
  "레지스트 밴드 인버전": "밴드 발목 안쪽 돌림 (Inversion)",
  "레지스트 밴드 에버전": "밴드 발목 바깥쪽 돌림 (Eversion)",
  "파르브리타 자누 시르사아사나":
    "앉아서 옆구리 늘리기 (Parivrtta Janu Sirsasana)",
  "어퍼 트랩 스트레칭": "상부 승모근 스트레칭 (Upper Trapezius)",
  "손목 플렉션 스트레칭": "손목 굽힘 스트레칭 (Flexion)",
  "손목 익스텐션 스트레칭": "손목 젖힘 스트레칭 (Extension)",
  "프로네이션/수피네이션": "손목 회전 운동 (Pronation/Supination)",
};

async function main() {
  console.log("🔄 운동 명칭 변경 시작...");

  // 1. JSON 파일 업데이트
  try {
    const fileContent = readFileSync(TEMPLATES_FILE, "utf-8");
    let templates = JSON.parse(fileContent);
    let jsonUpdateCount = 0;

    templates = templates.map((template) => {
      if (nameMapping[template.name]) {
        console.log(
          `📝 JSON 변경: "${template.name}" -> "${nameMapping[template.name]}"`,
        );
        template.name = nameMapping[template.name];
        jsonUpdateCount++;
      }
      return template;
    });

    if (jsonUpdateCount > 0) {
      writeFileSync(
        TEMPLATES_FILE,
        JSON.stringify(templates, null, 2),
        "utf-8",
      );
      console.log(`✅ JSON 파일 업데이트 완료 (${jsonUpdateCount}개 변경)`);
    } else {
      console.log("ℹ️ JSON 파일에서 변경할 항목을 찾지 못했습니다.");
    }
  } catch (error) {
    console.error("❌ JSON 파일 처리 중 오류:", error);
  }

  // 2. 데이터베이스 업데이트
  console.log("\n💾 데이터베이스 업데이트 시작...");
  let dbUpdateCount = 0;

  for (const [oldName, newName] of Object.entries(nameMapping)) {
    try {
      const result = await prisma.exerciseTemplate.updateMany({
        where: { name: oldName },
        data: { name: newName },
      });

      if (result.count > 0) {
        console.log(
          `✅ DB 변경: "${oldName}" -> "${newName}" (${result.count}개 레코드)`,
        );
        dbUpdateCount += result.count;
      }
    } catch (error) {
      console.error(`❌ DB 업데이트 실패 ("${oldName}"):`, error.message);
    }
  }

  console.log(`\n🎉 모든 작업 완료! (DB 총 ${dbUpdateCount}개 변경됨)`);
}

main()
  .catch((e) => {
    console.error("❌ 스크립트 실행 실패:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
