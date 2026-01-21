/**
 * @file scripts/fix-exercise-name-mapping.ts
 * @description 누락된 운동 이름을 DB의 실제 이름으로 매핑하고 이미지 파일명 수정
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface ExerciseData {
  name: string;
  filename: string;
  prompt: string;
}

/**
 * n8n_exercises.json의 운동 이름 -> DB의 실제 이름 매핑
 * 구글 검색 및 DB 확인 결과 기반
 */
const nameMapping: Record<string, string> = {
  "수퍼맨 운동": "슈퍼맨 운동", // DB에 "슈퍼맨 운동" 있음
  "글루트 브릿지": "브릿지 (힙 레이즈)", // DB에 "브릿지 (힙 레이즈)" 있음
  "카프 스트레칭": "발목 스트레칭 (Ankle Stretch)", // 유사한 운동
  "전완 스트레칭": "손목 스트레칭 (Wrist Stretch)", // 유사한 운동
  "랫 풀다운": "래트 풀다운 (Lat Pulldown)", // DB에 "래트 풀다운 (Lat Pulldown)" 있음
  "시티드 로우": "시티드 로우 (Seated Row)", // 이미 수정됨
  "등 스트레칭 (차일드 포즈)": "차일드 포즈 (Child's Pose)", // DB에 "차일드 포즈 (Child's Pose)" 있음
  "캣 스트레칭": "캣 카우 스트레칭", // DB에 "캣 카우 스트레칭" 있음
  "런지": "힙 플렉서 런지 (Hip Flexor Lunge)", // DB에 "힙 플렉서 런지 (Hip Flexor Lunge)" 있음
  // DB에 없는 운동들은 그대로 유지 (나중에 추가될 수 있음)
};

function loadExercisesData(): ExerciseData[] {
  const exercisesJsonPath = path.join(__dirname, "..", "n8n_exercises.json");
  const fileContent = fs.readFileSync(exercisesJsonPath, "utf8");
  return JSON.parse(fileContent);
}

function saveExercisesData(data: ExerciseData[]): void {
  const exercisesJsonPath = path.join(__dirname, "..", "n8n_exercises.json");
  fs.writeFileSync(exercisesJsonPath, JSON.stringify(data, null, 2), "utf8");
}

function renameImageFile(oldFilename: string, newFilename: string): boolean {
  const imagesDir = path.join(__dirname, "..", "public", "images", "exercises");
  
  const oldNameWithoutExt = oldFilename.replace(/\.(png|jpg|jpeg)$/i, "");
  const newNameWithoutExt = newFilename.replace(/\.(png|jpg|jpeg)$/i, "");
  
  const possibleExtensions = [".png.jpg", ".jpg", ".png", ".jpeg"];
  
  for (const ext of possibleExtensions) {
    const oldPath = path.join(imagesDir, `${oldNameWithoutExt}${ext}`);
    const newPath = path.join(imagesDir, `${newNameWithoutExt}${ext}`);
    
    if (fs.existsSync(oldPath)) {
      try {
        fs.renameSync(oldPath, newPath);
        console.log(`  📁 Renamed: ${oldNameWithoutExt}${ext} -> ${newNameWithoutExt}${ext}`);
        return true;
      } catch (error) {
        console.error(`  ❌ Failed to rename: ${error}`);
        return false;
      }
    }
  }
  
  return false;
}

async function main() {
  console.log("🔧 Fixing exercise name mappings...\n");

  // 1. DB의 모든 운동 이름 가져오기
  const dbExercises = await prisma.exerciseTemplate.findMany({
    select: { name: true },
  });
  const dbExerciseNames = new Set(dbExercises.map((e) => e.name));
  console.log(`📊 Total exercises in DB: ${dbExercises.length}\n`);

  // 2. n8n_exercises.json 로드
  const exercisesData = loadExercisesData();
  console.log(`📋 Loaded ${exercisesData.length} exercises from n8n_exercises.json\n`);

  // 3. 매핑 적용
  let fixed = 0;
  let renamed = 0;
  let notInDb = 0;

  for (let i = 0; i < exercisesData.length; i++) {
    const exercise = exercisesData[i];
    const mappedName = nameMapping[exercise.name];

    if (mappedName) {
      // 매핑된 이름이 DB에 있는지 확인
      if (dbExerciseNames.has(mappedName)) {
        console.log(`\n🔄 ${exercise.name} -> ${mappedName}`);
        
        // 파일명 생성 (공백을 언더스코어로, 특수문자 제거)
        const newFilename = mappedName
          .replace(/\s+/g, "_")
          .replace(/[()]/g, "")
          .replace(/\//g, "")
          .replace(/,/g, "")
          + ".png";

        // 이미지 파일명 변경
        if (renameImageFile(exercise.filename, newFilename)) {
          renamed++;
        }

        // JSON 데이터 업데이트
        exercisesData[i].name = mappedName;
        exercisesData[i].filename = newFilename;
        
        console.log(`  ✅ Updated`);
        fixed++;
      } else {
        console.log(`\n⚠️  Mapped name "${mappedName}" not found in DB`);
        notInDb++;
      }
    } else if (!dbExerciseNames.has(exercise.name)) {
      // 매핑이 없고 DB에도 없는 경우
      console.log(`\n⚠️  "${exercise.name}" - No mapping found and not in DB`);
      notInDb++;
    }
  }

  // 4. 업데이트된 JSON 저장
  if (fixed > 0) {
    saveExercisesData(exercisesData);
    console.log(`\n💾 Saved updated n8n_exercises.json`);
  }

  // 5. 최종 통계
  console.log("\n" + "=".repeat(60));
  console.log("📊 Summary");
  console.log("=".repeat(60));
  console.log(`✅ Fixed and mapped: ${fixed}`);
  console.log(`📁 Images renamed: ${renamed}`);
  console.log(`⚠️  Still not in DB: ${notInDb}`);
  console.log("=".repeat(60));

  // 6. 여전히 DB에 없는 운동 목록
  const stillMissing = exercisesData.filter(
    (ex) => !dbExerciseNames.has(ex.name)
  );

  if (stillMissing.length > 0) {
    console.log(`\n⚠️  Exercises still not in DB (${stillMissing.length}):`);
    for (const ex of stillMissing) {
      console.log(`  - ${ex.name}`);
    }
    console.log(`\n💡 These exercises may need to be added to the database.`);
  }

  if (fixed > 0) {
    console.log(`\n💡 Next step: Run 'pnpm tsx scripts/link-exercise-images.ts' to link the images`);
  }
}

main()
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

