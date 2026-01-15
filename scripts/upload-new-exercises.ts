import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// YouTube API Key (환경 변수 또는 하드코딩 - 실제 운영 시 환경변수 권장)
// 주의: 이 키는 공개되면 안 됩니다. 로컬 실행용입니다.
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

const prisma = new PrismaClient();

// JSON 파일 로드
const exerciseDataPath = path.join(__dirname, "data", "new-exercises.json");

interface NewExercise {
  name: string;
  description: string;
  instructions: string;
  bodyPart: string;
  intensityLevel: number;
  difficultyScore: number;
  videoKeywords: string;
  equipment: string[];
}

// 유튜브 검색 함수 (Mock or Real)
async function searchYouTube(query: string): Promise<string | null> {
  if (!YOUTUBE_API_KEY) {
    console.warn("⚠️ YouTube API Key가 없습니다. 비디오 ID 없이 진행합니다.");
    return null;
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        query,
      )}&key=${YOUTUBE_API_KEY}&maxResults=1&type=video`,
    );
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      return data.items[0].id.videoId;
    }
  } catch (error) {
    console.error(`YouTube Search Error for ${query}:`, error);
  }
  return null;
}

async function main() {
  console.log("🚀 신규 운동 데이터 업로드 시작...");

  if (!fs.existsSync(exerciseDataPath)) {
    console.error("❌ 데이터 파일을 찾을 수 없습니다:", exerciseDataPath);
    return;
  }

  const exercises: NewExercise[] = JSON.parse(
    fs.readFileSync(exerciseDataPath, "utf-8"),
  );

  console.log(`총 ${exercises.length}개의 운동 데이터를 처리합니다.`);

  // 기구 데이터 미 미리 로드
  const equipmentMap = new Map();
  const allEquipment = await prisma.equipmentType.findMany();
  allEquipment.forEach((eq) => equipmentMap.set(eq.name, eq.id));

  // 부위 데이터 미리 로드
  const bodyPartMap = new Map();
  const allBodyParts = await prisma.bodyPart.findMany();
  allBodyParts.forEach((bp) => bodyPartMap.set(bp.name, bp.id));

  for (const ex of exercises) {
    console.log(`\n处理: ${ex.name}...`);

    // 1. 중복 확인
    const existing = await prisma.exerciseTemplate.findFirst({
      where: { name: ex.name },
    });

    if (existing) {
      console.log(`- 이미 존재함, 스킵.`);
      continue;
    }

    // 2. 비디오 ID 검색
    // API 키가 없으면 null, 있으면 검색 시도
    // (할당량 이슈가 있을 수 있으므로 실제 키가 있을 때만 동작)
    let videoId = null;
    if (YOUTUBE_API_KEY) {
      videoId = await searchYouTube(ex.videoKeywords);
      if (videoId) console.log(`- Video Found: ${videoId}`);
    }

    // 3. 부위 찾기 (Required for ExerciseTemplate creation)
    const bodyPartId = bodyPartMap.get(ex.bodyPart);
    if (!bodyPartId) {
      console.warn(`- ⚠️ 부위를 찾을 수 없음: ${ex.bodyPart} (스킵)`);
      continue;
    }

    // 4. 운동 템플릿 생성 (Transaction 권장되지만 여기선 순차 진행)
    const newTemplate = await prisma.exerciseTemplate.create({
      data: {
        name: ex.name,
        description: ex.description,
        instructions: ex.instructions,
        videoUrl: videoId || undefined,
        // metValue: 3.0, (Schema에 없음)
        intensityLevel: ex.intensityLevel,
        difficultyScore: ex.difficultyScore,
        isActive: true,
        bodyPartId: bodyPartId, // 필수 필드 추가
      },
    });

    // 5. 기구 매핑
    for (const eqName of ex.equipment) {
      let eqId = equipmentMap.get(eqName);
      if (!eqId) {
        const newEq = await prisma.equipmentType.create({
          data: { name: eqName },
        });
        eqId = newEq.id;
        equipmentMap.set(eqName, eqId);
      }

      await prisma.exerciseEquipmentMapping.create({
        data: {
          exerciseTemplateId: newTemplate.id,
          equipmentTypeId: eqId,
          isRequired: true,
        },
      });
    }

    // 6. 부위 매핑 (BodyPartExerciseMapping) - 중복일 수 있으나 명시적 추가
    await prisma.bodyPartExerciseMapping.create({
      data: {
        bodyPartId: bodyPartId,
        exerciseTemplateId: newTemplate.id,
        priority: 1,
        isActive: true,
        intensityLevel: ex.intensityLevel,
      },
    });
    console.log(`- 생성 완료: ${ex.name} (${ex.bodyPart})`);
  }

  console.log("\n✅ 모든 작업이 완료되었습니다.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
