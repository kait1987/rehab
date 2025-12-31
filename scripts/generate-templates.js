/**
 * 플레이스홀더 템플릿 100개 생성 스크립트 (Node.js 버전)
 */

const fs = require("fs");
const path = require("path");

const bodyParts = ["허리", "어깨", "무릎", "목", "손목", "발목", "팔꿈치", "엉덩이", "등", "가슴"];
const equipmentTypes = ["매트", "덤벨", "머신", "밴드", "짐볼", "폼롤러", "케틀벨", "바벨", "TRX", "없음"];

const distribution = {
  허리: 15,
  어깨: 15,
  무릎: 15,
  목: 10,
  손목: 8,
  발목: 8,
  팔꿈치: 8,
  엉덩이: 8,
  등: 8,
  가슴: 5,
};

const exerciseTypeNames = {
  허리: "스트레칭",
  어깨: "안정화 운동",
  무릎: "강화 운동",
  목: "관절 운동",
  손목: "유연성 운동",
  발목: "안정성 운동",
  팔꿈치: "관절 운동",
  엉덩이: "강화 운동",
  등: "스트레칭",
  가슴: "유연성 운동",
};

function generateTemplates() {
  const templates = [];
  let id = 1;

  Object.entries(distribution).forEach(([part, count]) => {
    for (let i = 1; i <= count; i++) {
      const intensity = Math.floor(Math.random() * 4) + 1;
      const difficulty = Math.floor(Math.random() * 10) + 1;
      const duration = Math.floor(Math.random() * 26) + 5;
      const reps = Math.floor(Math.random() * 11) + 10;
      const sets = Math.floor(Math.random() * 3) + 2;
      const rest = Math.floor(Math.random() * 31) + 30;
      
      // 기구 선택 (0-3개, 없음 포함 가능)
      const equipmentCount = Math.floor(Math.random() * 4);
      let equipment = [];
      if (equipmentCount === 0) {
        equipment = ["없음"];
      } else {
        const availableEquipment = equipmentTypes.filter((e) => e !== "없음");
        const selected = availableEquipment
          .sort(() => Math.random() - 0.5)
          .slice(0, equipmentCount);
        equipment = selected.length > 0 ? selected : ["없음"];
      }

      templates.push({
        name: `${part} ${exerciseTypeNames[part]} ${i}`,
        bodyPartName: part,
        description: `${part} 부위를 위한 재활 운동 템플릿 ${i}번입니다.`,
        intensity_level: intensity,
        duration_minutes: duration,
        reps: reps,
        sets: sets,
        rest_seconds: rest,
        difficulty_score: difficulty,
        contraindications: [],
        instructions: `${part} 부위에 집중하는 운동입니다. 천천히 진행하세요.`,
        precautions: "통증이 심해지면 즉시 중단하고 전문의와 상담하세요.",
        equipmentTypes: equipment,
      });
      id++;
    }
  });

  return templates;
}

function main() {
  console.log("📝 플레이스홀더 템플릿 100개 생성 중...");
  
  const templates = generateTemplates();
  const outputPath = path.join(process.cwd(), "templates", "exercise-templates-100.json");
  
  fs.writeFileSync(outputPath, JSON.stringify(templates, null, 2), "utf-8");
  
  console.log(`✅ ${templates.length}개 템플릿 생성 완료: ${outputPath}`);
  
  // 부위별 통계
  const stats = {};
  templates.forEach((t) => {
    stats[t.bodyPartName] = (stats[t.bodyPartName] || 0) + 1;
  });
  
  console.log("\n📊 부위별 분배:");
  Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([part, count]) => {
      console.log(`  ${part}: ${count}개`);
    });
}

main();

