# 난이도 자동 조절 알고리즘

## 개요

사용자의 경험 수준, 통증 정도, 운동 이력 등을 종합하여 적절한 난이도의 운동을 자동으로 선택하는 알고리즘입니다.

## 입력 파라미터

```typescript
{
  experienceLevel: 'beginner' | 'intermediate' | 'advanced',
  painLevel: number, // 1-5
  exerciseHistory?: {
    completedCourses: number;
    lastCompletedDate?: Date;
    averageDifficulty?: number;
  }
}
```

## 알고리즘 단계

### 1단계: 기본 난이도 결정

**경험 수준 → 기본 난이도 매핑**:
```
beginner     → 원리 (principle)
intermediate → 적응 (adaptation)
advanced     → 도움 (mastery)
```

**코드**:
```typescript
const baseDifficulty = {
  'beginner': 'principle',
  'intermediate': 'adaptation',
  'advanced': 'mastery'
}[experienceLevel];
```

### 2단계: 통증 정도에 따른 조정

**조정 규칙**:
- 통증 5점: 원리 단계로 제한 (모든 경험 수준)
- 통증 4점: 원리 + 적응 단계 허용
- 통증 3점 이하: 모든 단계 허용

**조정 공식**:
```typescript
let targetDifficulty = baseDifficulty;

if (painLevel === 5) {
  targetDifficulty = 'principle'; // 강제로 원리 단계
} else if (painLevel === 4) {
  if (targetDifficulty === 'mastery') {
    targetDifficulty = 'adaptation'; // 도움 → 적응
  }
  // 원리, 적응은 그대로 유지
}
// 통증 3점 이하는 조정 없음
```

### 3단계: 허용 가능한 난이도 범위 계산

**범위 계산**:
```typescript
function getDifficultyRange(
  targetDifficulty: DifficultyLevel,
  painLevel: number
): { min: number; max: number } {
  // 통증 5점: 원리만 허용
  if (painLevel === 5) {
    return { min: 1, max: 3 };
  }
  
  // 통증 4점: 원리 + 적응 허용
  if (painLevel === 4) {
    return { min: 1, max: 7 };
  }
  
  // 통증 3점 이하: 모든 단계 허용
  // 하지만 목표 난이도에 따라 범위 조정
  switch (targetDifficulty) {
    case 'principle':
      return { min: 1, max: 4 }; // 원리 중심, 적응 일부 포함
    case 'adaptation':
      return { min: 1, max: 8 }; // 적응 중심, 원리/도움 일부 포함
    case 'mastery':
      return { min: 4, max: 10 }; // 도움 중심, 적응 일부 포함
  }
}
```

### 4단계: 난이도별 운동 비율 결정

**비율 계산**:
```typescript
function getDifficultyRatio(
  targetDifficulty: DifficultyLevel,
  painLevel: number
): {
  principle: number; // 0-100
  adaptation: number; // 0-100
  mastery: number; // 0-100
} {
  if (painLevel === 5) {
    return { principle: 100, adaptation: 0, mastery: 0 };
  }
  
  if (painLevel === 4) {
    return { principle: 50, adaptation: 50, mastery: 0 };
  }
  
  // 통증 3점 이하
  switch (targetDifficulty) {
    case 'principle':
      return { principle: 70, adaptation: 30, mastery: 0 };
    case 'adaptation':
      return { principle: 20, adaptation: 60, mastery: 20 };
    case 'mastery':
      return { principle: 10, adaptation: 30, mastery: 60 };
  }
}
```

### 5단계: 운동 필터링 및 선택

**필터링 로직**:
1. 허용 가능한 난이도 범위 내의 운동만 선택
2. 난이도별 비율에 맞춰 운동 선택
3. 우선순위 점수가 높은 운동부터 선택

**코드 예시**:
```typescript
// 1. 난이도 범위 필터링
const filteredExercises = exercises.filter((ex) => {
  const score = ex.difficultyScore || 5; // 기본값 5
  return score >= range.min && score <= range.max;
});

// 2. 난이도별 그룹화
const byDifficulty = {
  principle: filteredExercises.filter((ex) => {
    const score = ex.difficultyScore || 5;
    return score >= 1 && score <= 3;
  }),
  adaptation: filteredExercises.filter((ex) => {
    const score = ex.difficultyScore || 5;
    return score >= 4 && score <= 7;
  }),
  mastery: filteredExercises.filter((ex) => {
    const score = ex.difficultyScore || 5;
    return score >= 8 && score <= 10;
  }),
};

// 3. 비율에 맞춰 선택
const selectedExercises = [];
const totalNeeded = 10; // 예시

selectedExercises.push(
  ...byDifficulty.principle
    .sort((a, b) => a.priorityScore - b.priorityScore)
    .slice(0, Math.floor(totalNeeded * ratio.principle / 100))
);

selectedExercises.push(
  ...byDifficulty.adaptation
    .sort((a, b) => a.priorityScore - b.priorityScore)
    .slice(0, Math.floor(totalNeeded * ratio.adaptation / 100))
);

selectedExercises.push(
  ...byDifficulty.mastery
    .sort((a, b) => a.priorityScore - b.priorityScore)
    .slice(0, Math.floor(totalNeeded * ratio.mastery / 100))
);
```

## 향후 확장: 운동 이력 기반 조정

### 운동 이력 활용 (향후 구현)

**이력 기반 조정**:
- 이전 코스 완료 횟수에 따라 난이도 점진적 증가
- 마지막 완료일로부터 경과 시간 고려
- 평균 완료 난이도 추적

**조정 공식 (향후)**:
```typescript
// 완료한 코스가 3개 이상이면 난이도 +1 단계
if (exerciseHistory.completedCourses >= 3) {
  // 적응 → 도움, 원리 → 적응
  // 단, 통증이 높으면 조정 제한
}
```

## 예시 시나리오

### 시나리오 1: 초보자 + 통증 5점
```
입력:
- experienceLevel: 'beginner'
- painLevel: 5

처리:
1. 기본 난이도: 원리
2. 통증 조정: 없음 (이미 최저)
3. 허용 범위: 1-3
4. 비율: 원리 100%

결과:
- difficulty_score 1-3인 운동만 선택
- 원리 단계 운동 100%
```

### 시나리오 2: 중급자 + 통증 3점
```
입력:
- experienceLevel: 'intermediate'
- painLevel: 3

처리:
1. 기본 난이도: 적응
2. 통증 조정: 없음
3. 허용 범위: 1-8
4. 비율: 원리 20%, 적응 60%, 도움 20%

결과:
- difficulty_score 1-8인 운동 선택
- 적응 단계 중심, 원리/도움 일부 포함
```

### 시나리오 3: 고급자 + 통증 5점 (안전 우선)
```
입력:
- experienceLevel: 'advanced'
- painLevel: 5

처리:
1. 기본 난이도: 도움
2. 통증 조정: 도움 → 원리 (강제)
3. 허용 범위: 1-3
4. 비율: 원리 100%

결과:
- difficulty_score 1-3인 운동만 선택
- 경험 수준이 높아도 통증이 높으면 원리 단계로 제한
```

## 성능 최적화

### 데이터베이스 쿼리 최적화
```typescript
// difficulty_score로 필터링하여 불필요한 데이터 로드 방지
const exercises = await prisma.exerciseTemplate.findMany({
  where: {
    difficultyScore: {
      gte: range.min,
      lte: range.max,
    },
    isActive: true,
  },
  include: {
    // 필요한 관계만 include
  },
});
```

### 메모리 최적화
- 난이도별 그룹화는 Map 자료구조 활용
- 우선순위 정렬은 필요한 개수만큼만 정렬

## 에러 처리

### 경계 케이스
1. **난이도에 맞는 운동이 없는 경우**: 한 단계 낮은 난이도로 확장
2. **통증이 매우 높은 경우**: 원리 단계만 선택, 경고 메시지
3. **경험 수준이 불명확한 경우**: beginner로 기본값 설정

## 참고사항

- 안전 우선 원칙: 통증이 높으면 난이도 하향 조정
- 점진적 증가: 향후 운동 이력을 활용한 개인화
- 유연성: 경계값에 있는 운동은 상황에 따라 다른 단계로도 분류 가능

