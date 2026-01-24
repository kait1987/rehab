/**
 * @file scripts/improve-prompts.ts
 * @description n8n_exercises.json의 프롬프트를 개선하는 유틸리티
 */

interface ExerciseData {
  name: string;
  filename: string;
  prompt: string;
}

/**
 * 두 자세 형식 프롬프트를 생성합니다 (공간 분리 강조).
 * 참고 이미지처럼 두 자세가 겹치지 않고 공간을 나눠서 표시되도록 합니다.
 * 
 * @param exerciseName - 운동 이름
 * @param pose1Description - 첫 번째 자세 설명
 * @param pose1Label - 첫 번째 자세 라벨 (예: "Cat stretches")
 * @param pose2Description - 두 번째 자세 설명
 * @param pose2Label - 두 번째 자세 라벨 (예: "Cow stretches")
 * @param startingPoseDescription - 시작 자세 설명
 * @returns 두 자세 형식 프롬프트
 */
export function createDualPosePrompt(
  exerciseName: string,
  pose1Description: string,
  pose1Label: string,
  pose2Description: string,
  pose2Label: string,
  startingPoseDescription: string
): string {
  return `instructional illustration showing ${exerciseName} exercise divided into three distinct areas, no overlapping:
small top-left corner inset: starting position showing ${startingPoseDescription},
upper half labeled "${pose1Label}": ${pose1Description}, exactly one human person with normal human face, normal human head, normal human body, wearing exercise clothing,
lower half labeled "${pose2Label}": ${pose2Description}, exactly one human person with normal human face, normal human head, normal human body, wearing exercise clothing,
upper half and lower half are clearly separated by horizontal dividing line, no overlapping, no duplicate figures,
each section shows exactly one normal human person, realistic human person in exercise clothing, side view,
minimalist vector illustration, soft pastel background,
normal human face, normal human head, normal human body, human person only, 
no animals, no animal features, no animal shapes, no animal heads, no dog, no cat, no cow, no bird, no monster, no creature, no hybrid, no deformed, no mutated,
no abstract shapes, no fantasy creatures,
professional medical illustration style`;
}

/**
 * 프롬프트를 개선합니다.
 * 참고 이미지 스타일에 맞춰 공통 스타일 지시사항을 추가하고,
 * 운동 자세 설명을 가장 앞에 배치합니다.
 */
export function improvePrompt(originalPrompt: string, exerciseName?: string): string {
  let improved = originalPrompt;
  
  // 1. "Minimalist vector illustration of [운동명]:" 제거
  improved = improved.replace(/^Minimalist vector illustration of [^:]+:\s*/i, "");
  
  // 2. 다중 자세 표현 제거
  improved = improved.replace(/\bshowing both positions\b/gi, "");
  improved = improved.replace(/\bfour poses showing\b/gi, "");
  improved = improved.replace(/\balternating between\b/gi, "");
  improved = improved.replace(/\bshowing\s+(both|multiple|four|two)\s+(positions?|poses?)\b/gi, "");
  
  // 3. 동물 이름이 포함된 운동 특별 처리
  const exerciseNameLower = exerciseName?.toLowerCase() || "";
  const hasAnimalName = 
    exerciseNameLower.includes("cat") || 
    exerciseNameLower.includes("cow") || 
    exerciseNameLower.includes("bird") || 
    exerciseNameLower.includes("dog") ||
    exerciseNameLower.includes("캣") ||
    exerciseNameLower.includes("카우") ||
    exerciseNameLower.includes("버드") ||
    exerciseNameLower.includes("독");
  
  if (hasAnimalName) {
    // 동물 이름 제거
    if (exerciseNameLower.includes("cat") || exerciseNameLower.includes("cow") || exerciseNameLower.includes("캣") || exerciseNameLower.includes("카우")) {
      improved = improved.replace(/cat-cow|Cat-Cow|cat and cow/gi, "");
      improved = improved.replace(/\(cat\)/gi, "");
      improved = improved.replace(/\(cow\)/gi, "");
      // "alternating between" 제거 후 단일 자세 선택
      if (improved.includes("arching back upward")) {
        improved = improved.replace(/alternating between.*?dropping belly down/gi, "");
      }
    }
    if (exerciseNameLower.includes("bird") || exerciseNameLower.includes("dog") || exerciseNameLower.includes("버드") || exerciseNameLower.includes("독")) {
      improved = improved.replace(/Bird Dog|bird dog/gi, "");
    }
  }
  
  // 4. white background를 soft pastel background로 변경
  improved = improved.replace(/white background/gi, "soft pastel background");
  
  // 5. person을 realistic human person in exercise clothing으로 변경
  if (!improved.includes("realistic human person")) {
    improved = improved.replace(/\bperson\b/gi, "realistic human person in exercise clothing");
  } else {
    improved = improved.replace(/\brealistic human person\b(?!\s+in exercise clothing)/gi, "realistic human person in exercise clothing");
  }
  
  // 6. 중복 제거
  improved = improved.replace(/\brealistic human person in exercise clothing\s+in exercise clothing/gi, "realistic human person in exercise clothing");
  improved = improved.replace(/\brealistic human\s+realistic human/gi, "realistic human");
  
  // 7. 프롬프트 구조 재구성: 운동 자세 설명을 앞에 배치
  // 기존 프롬프트에서 운동 자세 설명 부분 추출
  const poseDescription = improved
    .replace(/,\s*(side view|front view|back view|from above).*$/i, "") // 뷰 정보 제거
    .replace(/,\s*(clean lines|soft pastel background|no animals|no abstract shapes|professional medical illustration style).*$/i, "") // 스타일 정보 제거
    .trim();
  
  // 스타일 지시사항 추출
  const viewMatch = improved.match(/(side view|front view|back view|from above)/i);
  const view = viewMatch ? viewMatch[1] : "side view";
  
  // 새로운 구조: [운동 자세 설명], realistic human person in exercise clothing, [뷰], minimalist vector illustration, [스타일]
  const newPrompt = `${poseDescription}, realistic human person in exercise clothing, ${view}, minimalist vector illustration, soft pastel background, human face only, no animals, no animal features, no abstract shapes, professional medical illustration style`;
  
  // 8. 중복된 쉼표 정리
  let finalPrompt = newPrompt.replace(/,\s*,/g, ",").replace(/\s+/g, " ").trim();
  
  return finalPrompt;
}

/**
 * 전체 운동 데이터의 프롬프트를 개선합니다.
 */
export function improveAllPrompts(exercises: ExerciseData[]): ExerciseData[] {
  return exercises.map(exercise => ({
    ...exercise,
    prompt: improvePrompt(exercise.prompt, exercise.name)
  }));
}

