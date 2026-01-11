# Package.json 업데이트 가이드

## 1. 의존성 설치

```bash
pnpm add -D vitest @vitest/coverage-v8
```

## 2. scripts 섹션에 추가

package.json의 `scripts` 섹션에 다음을 추가하세요:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

## 3. 실행 명령어

```bash
# 모든 테스트 실행 (한 번)
pnpm test

# 워치 모드로 테스트 실행 (파일 변경 시 자동 재실행)
pnpm test:watch

# 커버리지 리포트 생성
pnpm test:coverage

# 특정 테스트 파일만 실행
pnpm vitest run src/lib/utils/__tests__/filter-contraindications.test.ts
```

## 4. 예상 결과

```
✓ src/lib/utils/__tests__/deduplicate-exercises.test.ts (15 tests)
✓ src/lib/utils/__tests__/calculate-priority.test.ts (25 tests)
✓ src/lib/utils/__tests__/classify-by-section.test.ts (18 tests)
✓ src/lib/utils/__tests__/filter-contraindications.test.ts (22 tests)
✓ src/lib/utils/__tests__/distribute-time.test.ts (21 tests)

Test Files  5 passed (5)
     Tests  101 passed (101)
  Coverage  96%
```
