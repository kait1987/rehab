const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const IMAGES_DIR = path.join(__dirname, "../public/images/exercises");

// DB 운동 이름 -> 사용할 이미지 파일 매핑
// 이 운동들은 JSON에 없지만 기존 이미지를 재사용할 수 있음
const REMAINING_MAPPINGS = {
  "랫 풀다운": "페이스_풀.png", // 페이스 풀 이미지 재사용 (비슷한 상체 운동)
  "수퍼맨 운동": "슈퍼맨_운동.png", // 오타 수정 (수퍼맨 -> 슈퍼맨)
  "캣 스트레칭": "캣_카우_스트레칭.png", // 캣 카우 스트레칭 이미지 재사용
  "팔 스트레칭": "크로스바디_스트레칭.png", // 크로스바디 사용
  런지: "힙_플렉서_런지_(Hip_Flexor_Lunge).png", // 런지 이미지 재사용
  "글루트 브릿지": "브릿지_힙_레이즈.png", // 브릿지 이미지 재사용
  "허벅지 스트레칭": "쿼드_스트레칭.png", // 쿼드 스트레칭 재사용
  "팔꿈치 플렉션 스트레칭": "손목_굽힘_스트레칭_Flexion.png", // 비슷한 스트레칭
};

async function main() {
  console.log("🔗 Linking remaining 8 exercises...\n");

  for (const [dbName, filename] of Object.entries(REMAINING_MAPPINGS)) {
    // Find actual file
    let targetFilename = null;
    const potentialPaths = [filename, filename + ".jpg"];
    for (const p of potentialPaths) {
      if (fs.existsSync(path.join(IMAGES_DIR, p))) {
        targetFilename = p;
        break;
      }
    }

    if (!targetFilename) {
      console.log(`❌ File not found: ${filename}`);
      continue;
    }

    // Find DB record
    const dbExercise = await prisma.exerciseTemplate.findFirst({
      where: { name: dbName },
    });

    if (!dbExercise) {
      console.log(`❌ DB record not found: ${dbName}`);
      continue;
    }

    // Update
    const imageUrl = `/images/exercises/${targetFilename}`;
    await prisma.exerciseTemplate.update({
      where: { id: dbExercise.id },
      data: { imageUrl },
    });

    console.log(`✅ ${dbName} -> ${imageUrl}`);
  }

  console.log("\n📊 Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
