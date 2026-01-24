/**
 * @file scripts/clean-and-improve-exercises.ts
 * @description n8n_exercises.json의 중복 항목 제거 및 프롬프트 개선
 */

import * as fs from "fs";
import * as path from "path";
import { improvePrompt, createDualPosePrompt } from "./improve-prompts";

interface ExerciseData {
  name: string;
  filename: string;
  prompt: string;
}

/**
 * 중복 항목을 제거합니다.
 * 같은 이름의 운동 중 첫 번째 항목만 유지하고 나머지는 제거합니다.
 * 단, 잘못된 프롬프트를 가진 항목은 우선 제거합니다.
 */
function removeDuplicates(exercises: ExerciseData[]): ExerciseData[] {
  const nameMap = new Map<string, ExerciseData[]>();
  
  // 이름별로 그룹화
  exercises.forEach(ex => {
    if (!nameMap.has(ex.name)) {
      nameMap.set(ex.name, []);
    }
    nameMap.get(ex.name)!.push(ex);
  });
  
  const result: ExerciseData[] = [];
  const removed: string[] = [];
  
  // 각 그룹에서 최적의 항목 선택
  nameMap.forEach((items, name) => {
    if (items.length === 1) {
      // 중복이 없으면 그대로 추가
      result.push(items[0]);
    } else {
      // 중복이 있으면 가장 적절한 항목 선택
      // 1. 잘못된 프롬프트 제거 (Arm stretch, Lat Pulldown, Thigh stretch, Elbow Flexion 등)
      const validItems = items.filter(item => {
        const prompt = item.prompt.toLowerCase();
        const isWrong = 
          prompt.includes("arm stretch") && !prompt.includes("cat-cow") ||
          prompt.includes("lat pulldown") ||
          prompt.includes("thigh stretch") && !prompt.includes("hamstring") ||
          prompt.includes("elbow flexion stretch");
        return !isWrong;
      });
      
      // 2. 유효한 항목이 있으면 첫 번째 사용, 없으면 원본의 첫 번째 사용
      const selected = validItems.length > 0 ? validItems[0] : items[0];
      result.push(selected);
      
      // 제거된 항목 기록
      items.forEach(item => {
        if (item !== selected) {
          removed.push(`${name} (${item.prompt.substring(0, 50)}...)`);
        }
      });
    }
  });
  
  if (removed.length > 0) {
    console.log("\n제거된 중복 항목:");
    removed.forEach(item => console.log(`  - ${item}`));
  }
  
  return result;
}

/**
 * 메인 함수
 */
function main() {
  console.log("🧹 Cleaning and improving n8n_exercises.json...\n");
  
  const jsonPath = path.join(__dirname, "..", "n8n_exercises.json");
  
  // 1. 파일 읽기
  const exercises: ExerciseData[] = JSON.parse(
    fs.readFileSync(jsonPath, "utf8")
  );
  
  console.log(`📋 Original count: ${exercises.length}`);
  
  // 2. 중복 제거
  const cleaned = removeDuplicates(exercises);
  console.log(`📋 After removing duplicates: ${cleaned.length}`);
  
  // 3. 프롬프트 개선
  const improved = cleaned.map(ex => ({
    ...ex,
    prompt: improvePrompt(ex.prompt, ex.name)
  }));
  
  // 4. 두 자세가 필요한 운동 정의 (공간 분리 형식)
  interface DualPoseConfig {
    pose1Description: string;
    pose1Label: string;
    pose2Description: string;
    pose2Label: string;
    startingPoseDescription: string;
  }

  const dualPoseExercises: Record<string, DualPoseConfig> = {
    "캣 카우 스트레칭": {
      startingPoseDescription: "normal human person in exercise clothing on hands and knees, neutral spine, flat back, head aligned with spine, normal human face",
      pose1Description: "normal human person in exercise clothing on hands and knees, back arched upward creating rounded curve, spine curved upward, head looking down between arms, normal human face visible, normal human head, normal human body",
      pose1Label: "Cat stretches",
      pose2Description: "normal human person in exercise clothing on hands and knees, belly dropping down toward floor, back arching downward creating dip, head looking up and forward, normal human face visible, normal human head, normal human body",
      pose2Label: "Cow stretches",
    },
    "손목 회전 운동 (Pronation/Supination)": {
      startingPoseDescription: "realistic human person in exercise clothing standing, elbow bent 90 degrees at side, forearm in neutral position",
      pose1Description: "realistic human person in exercise clothing standing, elbow bent 90 degrees at side, forearm rotating palm facing downward (pronation), human hand visible",
      pose1Label: "Pronation",
      pose2Description: "realistic human person in exercise clothing standing, elbow bent 90 degrees at side, forearm rotating palm facing upward (supination), human hand visible",
      pose2Label: "Supination",
    },
  };

  // 5. 특별 처리: 단일 자세 운동들
  const specialExercises: Record<string, string> = {
    "버드독": "one person only, single person, no multiple people, no duplicate, human person on hands and knees, one arm straight forward, opposite leg straight back, only one person, realistic human person in exercise clothing, side view, minimalist vector illustration, soft pastel background, human face only, no animals, no abstract shapes, no pixel art, no poster, professional medical illustration style",
    "플랭크": "one person only, single person, no multiple people, no duplicate, human person lying face down, elbows on ground, toes on ground, body straight, only one person, realistic human person in exercise clothing, side view, minimalist vector illustration, soft pastel background, human face only, no animals, no abstract shapes, no pixel art, no poster, professional medical illustration style",
    "브릿지 (힙 레이즈)": "one person only, single person, no multiple people, no duplicate, no second head, no second person, human person lying on back, knees bent, feet on ground, hips raised up, only one person, realistic human person in exercise clothing, side view, minimalist vector illustration, soft pastel background, human face only, no animals, no abstract shapes, no pixel art, no poster, professional medical illustration style",
    "스쿼트": "one person only, single person, no multiple people, no duplicate, human person standing, feet apart, knees bent, body lowered down, only one person, realistic human person in exercise clothing, side view, minimalist vector illustration, soft pastel background, human face only, no animals, no abstract shapes, no pixel art, no poster, professional medical illustration style",
    "YTWL 운동": "one person only, single person, no multiple people, no duplicate, human person lying face down, arms raised up in Y shape, only one person, realistic human person in exercise clothing, front view from above, minimalist vector illustration, soft pastel background, human face only, no animals, no abstract shapes, no pixel art, no poster, professional medical illustration style",
  };
  
  // 특별 처리 적용: 두 자세 형식 또는 단일 자세 형식
  const finalImproved = improved.map(ex => {
    // 두 자세 형식이 필요한 운동
    if (dualPoseExercises[ex.name]) {
      const config = dualPoseExercises[ex.name];
      return {
        ...ex,
        prompt: createDualPosePrompt(
          ex.name,
          config.pose1Description,
          config.pose1Label,
          config.pose2Description,
          config.pose2Label,
          config.startingPoseDescription
        ),
      };
    }
    // 단일 자세 형식 특별 처리
    if (specialExercises[ex.name]) {
      return { ...ex, prompt: specialExercises[ex.name] };
    }
    return ex;
  });
  
  // 5. 파일 저장
  fs.writeFileSync(
    jsonPath,
    JSON.stringify(finalImproved, null, 2),
    "utf8"
  );
  
  console.log(`\n✅ Saved improved exercises to ${jsonPath}`);
  console.log(`📊 Final count: ${finalImproved.length}`);
  console.log(`📉 Removed: ${exercises.length - finalImproved.length} duplicate items`);
  
  // 6. 특별 처리된 운동 출력
  const allSpecialExercises = [
    ...Object.keys(dualPoseExercises).map(name => `${name} (dual pose)`),
    ...Object.keys(specialExercises),
  ];
  if (allSpecialExercises.length > 0) {
    console.log("\n🔧 Specially processed exercises:");
    allSpecialExercises.forEach(name => {
      console.log(`  - ${name}`);
    });
  }
  
  // 7. 샘플 프롬프트 출력
  console.log("\n📝 Sample improved prompts:");
  finalImproved.slice(0, 3).forEach(ex => {
    console.log(`\n${ex.name}:`);
    console.log(`  ${ex.prompt.substring(0, 150)}...`);
  });
}

main();

