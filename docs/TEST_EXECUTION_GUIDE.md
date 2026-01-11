# 테스트 실행 가이드

Merge Engine 단위 테스트 실행 및 디버깅 가이드입니다.

---

## 📦 설치

```bash
# Vitest 및 커버리지 도구 설치
pnpm add -D vitest @vitest/coverage-v8
```

---

## 🚀 실행 명령어

### 기본 실행
```bash
# 모든 테스트 한 번 실행
pnpm vitest run

# 워치 모드 (파일 변경 시 자동 재실행)
pnpm vitest

# 커버리지 리포트
pnpm vitest run --coverage
```

### 특정 테스트 실행
```bash
# 특정 파일만 실행
pnpm vitest run src/lib/utils/__tests__/filter-contraindications.test.ts

# 특정 테스트 이름으로 필터링
pnpm vitest run -t "strict 금기"

# 특정 describe 블록만 실행
pnpm vitest run -t "기본 동작"
```

---

## 📁 테스트 파일 구조

```
src/lib/utils/__tests__/
├── test-fixtures.ts              # 공용 Mock 데이터
├── deduplicate-exercises.test.ts # 15개 테스트
├── calculate-priority.test.ts    # 25개 테스트
├── classify-by-section.test.ts   # 18개 테스트
├── filter-contraindications.test.ts # 22개 테스트
└── distribute-time.test.ts       # 21개 테스트
```

---

## 🧪 테스트 대상 함수

| 함수 | 파일 | 테스트 수 |
|-----|------|---------|
| `deduplicateExercises` | `deduplicate-exercises.ts` | 15개 |
| `calculatePriorityScore` | `calculate-priority.ts` | 25개 |
| `classifyBySection` | `classify-by-section.ts` | 18개 |
| `filterContraindications` | `filter-contraindications.ts` | 22개 |
| `distributeTime` | `distribute-time.ts` | 21개 |

---

## 📊 예상 결과

```
✓ src/lib/utils/__tests__/deduplicate-exercises.test.ts (15)
✓ src/lib/utils/__tests__/calculate-priority.test.ts (25)
✓ src/lib/utils/__tests__/classify-by-section.test.ts (18)
✓ src/lib/utils/__tests__/filter-contraindications.test.ts (22)
✓ src/lib/utils/__tests__/distribute-time.test.ts (21)

Test Files  5 passed (5)
     Tests  101 passed (101)
```

---

## ❓ 문제 해결

### Path Alias 오류
```
Cannot find module '@/types/body-part-merge'
```
해결: `vitest.config.ts`의 `resolve.alias` 설정 확인

### 타입 오류
```
Cannot find module 'vitest'
```
해결: `pnpm add -D vitest` 실행 후 IDE 재시작

### 커버리지 오류
```
Unknown provider: v8
```
해결: `pnpm add -D @vitest/coverage-v8` 실행

---

## 📋 package.json 스크립트

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```
