# 다중 부위 병합 알고리즘

## 개요

사용자가 여러 부위를 선택했을 때, 각 부위별 추천 운동을 병합하여 최종 코스를 생성하는 알고리즘입니다.

## 입력 (MergeRequest)

```typescript
{
  bodyParts: [
    { bodyPartId: "uuid1", bodyPartName: "허리", painLevel: 5 },
    { bodyPartId: "uuid2", bodyPartName: "어깨", painLevel: 3 }
  ],
  painLevel: 5, // 최대값 또는 평균
  equipmentAvailable: ["매트", "덤벨"],
  experienceLevel: "beginner",
  totalDurationMinutes: 90
}
```

## 알고리즘 단계

### 1단계: 각 부위별 추천 운동 조회

**데이터베이스 쿼리**:
```typescript
const mappings = await prisma.bodyPartExerciseMapping.findMany({
  where: {
    bodyPartId: { in: bodyPartIds },
    isActive: true,
  },
  include: {
    exerciseTemplate: {
      include: {
        exerciseEquipmentMappings: {
          include: { equipmentType: true }
        }
      }
    },
    bodyPart: true,
  },
  orderBy: [
    { bodyPartId: 'asc' },
    { priority: 'asc' },
  ],
});
```

**필터링**:
- `pain_level_range`와 사용자 `painLevel` 매칭
  - `'1-2'`: painLevel 1-2에만 적용
  - `'3-4'`: painLevel 3-4에만 적용
  - `'5'`: painLevel 5에만 적용
  - `'all'`: 모든 painLevel에 적용
- `is_active = true`만 선택
- 사용 가능한 기구 필터링 (선택적)

**결과**: 각 부위별 추천 운동 목록

### 2단계: 우선순위 점수 계산

**공식**:
```
우선순위 점수 = (통증 정도 × 100) 
              + (부위 기본 우선순위 × 10) 
              - (운동 강도 × 1) 
              + (매핑 priority × 0.1)
```

**예시**:
- 허리 운동 (통증 5, 기본 우선순위 1, 강도 1, 매핑 priority 1)
  - 점수: (5×100) + (1×10) - (1×1) + (1×0.1) = 509.1
- 어깨 운동 (통증 3, 기본 우선순위 3, 강도 2, 매핑 priority 1)
  - 점수: (3×100) + (3×10) - (2×1) + (1×0.1) = 328.1

**정렬**: 점수가 낮을수록 우선순위 높음

### 3단계: 운동 템플릿 병합 및 중복 제거

**알고리즘**:
1. `exercise_template_id`를 키로 그룹화
2. 같은 템플릿을 가진 매핑들을 하나로 병합
3. `bodyPartIds` 배열에 모든 부위 ID 포함
4. 우선순위 점수는 가장 높은 우선순위(가장 낮은 점수) 사용
5. 다른 속성들(intensityLevel, painLevelRange 등)은 첫 번째 매핑 값 사용

**예시**:
```
입력:
- 허리 운동 A (template_id: "t1", priorityScore: 509.1)
- 어깨 운동 B (template_id: "t2", priorityScore: 328.1)
- 허리 운동 C (template_id: "t1", priorityScore: 510.2) // 중복

출력:
- 운동 A (template_id: "t1", bodyPartIds: ["허리"], priorityScore: 509.1)
- 운동 B (template_id: "t2", bodyPartIds: ["어깨"], priorityScore: 328.1)
```

### 4단계: 금기 운동 필터링

**데이터베이스 쿼리**:
```typescript
const contraindications = await prisma.bodyPartContraindication.findMany({
  where: {
    bodyPartId: { in: bodyPartIds },
    isActive: true,
  },
  include: {
    exerciseTemplate: true,
  },
});
```

**필터링 규칙**:
1. `pain_level_min`이 NULL이면 항상 금기
2. 사용자 `painLevel >= pain_level_min`이면 금기
3. `severity = 'strict'`인 경우: 무조건 제외
4. `severity = 'warning'`인 경우: 경고만 표시하고 포함

**예시**:
- 허리 통증 5점
- 금기 운동: `pain_level_min = 4, severity = 'strict'`
- 결과: 해당 운동 제외

### 5단계: 섹션별 분류

**분류 규칙**:

#### Warmup (준비 운동)
- **조건**: `intensityLevel <= 2`, 스트레칭 위주
- **시간**: 10-15분
- **개수**: 2-4개 운동
- **우선순위**: 가장 높은 우선순위 운동부터

#### Main (메인 운동)
- **조건**: 모든 강도 레벨
- **시간**: 60-70분 (90분 코스 기준)
- **개수**: 4-8개 운동
- **우선순위**: 우선순위 점수 순서

#### Cooldown (마무리 운동)
- **조건**: `intensityLevel <= 2`, 스트레칭 위주
- **시간**: 10-15분
- **개수**: 2-3개 운동
- **우선순위**: 낮은 강도 운동 우선

**분류 알고리즘**:
1. 모든 운동을 `intensityLevel`과 운동 유형으로 분류
2. Warmup: 낮은 강도 + 스트레칭 → 상위 2-4개
3. Main: 나머지 모든 운동
4. Cooldown: 낮은 강도 + 스트레칭 → 하위 2-3개

### 6단계: 시간 배분

**목표**: `totalDurationMinutes`에 맞춰 각 운동의 시간 조정

**배분 규칙**:
1. **Warmup**: 10-15분 (고정)
2. **Main**: 나머지 시간의 70-80%
3. **Cooldown**: 10-15분 (고정)

**시간 조정 알고리즘**:
```typescript
// 1. 기본 시간 계산
const warmupTime = 15; // 분
const cooldownTime = 15; // 분
const mainTime = totalDurationMinutes - warmupTime - cooldownTime;

// 2. 각 운동에 시간 배분
// 우선순위가 높은 운동부터 시간 할당
// 최소 운동 시간: 5분
// 최대 운동 시간: 20분 (main), 10분 (warmup/cooldown)

// 3. sets, reps 조정
// 시간에 맞춰 sets와 reps를 비례적으로 조정
```

**예시 (90분 코스)**:
- Warmup: 15분 (3개 운동, 각 5분)
- Main: 60분 (5개 운동, 각 12분)
- Cooldown: 15분 (2개 운동, 각 7.5분)

## 출력 (MergeResult)

```typescript
{
  exercises: [
    {
      exerciseTemplateId: "uuid",
      exerciseTemplateName: "허리 스트레칭",
      bodyPartIds: ["허리"],
      priorityScore: 509.1,
      section: "warmup",
      orderInSection: 1,
      durationMinutes: 5,
      reps: 10,
      sets: 2,
      restSeconds: 30,
      intensityLevel: 1,
      painLevelRange: "1-2"
    },
    // ... 더 많은 운동
  ],
  totalDuration: 90,
  warnings: ["어깨 고강도 운동은 경고 수준입니다."],
  stats: {
    warmup: 3,
    main: 5,
    cooldown: 2,
    byBodyPart: {
      "허리": 5,
      "어깨": 5
    }
  }
}
```

## 예시 시나리오

### 시나리오: 허리(통증 5점) + 어깨(통증 3점) 선택, 90분 코스

**1단계: 추천 운동 조회**
- 허리: 5개 운동 (priority 1-5)
- 어깨: 4개 운동 (priority 1-4)
- 총 9개 운동

**2단계: 우선순위 점수 계산**
- 허리 운동 1: 509.1
- 어깨 운동 1: 328.1
- 허리 운동 2: 510.2
- 어깨 운동 2: 329.2
- ... (점수 순서로 정렬)

**3단계: 중복 제거**
- 총 9개 → 중복 없음 → 9개 유지

**4단계: 금기 운동 필터링**
- 허리 통증 5점 → 고강도 어깨 운동 1개 제외
- 최종 8개 운동

**5단계: 섹션별 분류**
- Warmup: 3개 (낮은 강도)
- Main: 4개 (다양한 강도)
- Cooldown: 2개 (낮은 강도)

**6단계: 시간 배분**
- Warmup: 15분 (3개 × 5분)
- Main: 60분 (4개 × 15분)
- Cooldown: 15분 (2개 × 7.5분)

## 성능 최적화

### 데이터베이스 쿼리 최적화
- 모든 부위의 매핑을 한 번에 조회 (N+1 문제 방지)
- `include`를 사용하여 관련 데이터를 한 번에 로드
- 인덱스 활용: `body_part_id`, `priority`, `is_active`

### 메모리 최적화
- 대량의 운동 데이터 처리 시 스트리밍 방식 고려
- 중복 제거 시 Map 자료구조 활용

## 에러 처리

### 경계 케이스
1. **추천 운동이 없는 경우**: 기본 운동 템플릿 사용 또는 에러 반환
2. **모든 운동이 금기인 경우**: 경고 메시지와 함께 기본 운동 제공
3. **시간이 부족한 경우**: 우선순위가 높은 운동만 선택
4. **시간이 남는 경우**: 추가 운동 제안 또는 시간 조정

## 참고사항

- 이 알고리즘은 3.2 다중 부위 병합 로직 구현에서 사용됩니다
- 실제 코스 생성은 3.4 운동 루틴 생성 로직에서 이 알고리즘을 활용합니다
- 알고리즘 파라미터(가중치, 시간 배분 비율 등)는 조정 가능합니다

