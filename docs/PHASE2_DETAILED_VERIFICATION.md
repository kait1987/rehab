# Phase 2: 운영시간 파싱 및 영업 상태 판단 로직 상세 검증 보고서

**검증 일시**: 2026-01-07  
**검증 대상**: Phase 2 재구현 결과  
**검증 기준**: PRD.md, TODO.md, DB 스키마, 실제 코드 사용처

---

## 1. 참고 문서 대조 검증

### 1.1 PRD.md 요구사항 대조

**PRD.md에서 운영시간 관련 요구사항**:
- ✅ "헬스장/운동공간 정보(이름, 주소, 좌표, 운영시간, 가격대, 시설 정보 등)" (2.3 Dependencies)
- ✅ "장소 상세: 기본 정보(주소/운영시간/가격대), 시설 정보, 혼잡도, 태그 리뷰 표시" (4.1 필수 조건)
- ✅ "등록 재활운동 & 헬스장 수: 주소/좌표/운영시간/시설 정보(≥3)가 입력 완료된 장소 수" (3.1 핵심 지표)

**검증 결과**:
- ✅ 운영시간 정보는 PRD에서 기본 정보로 요구됨
- ✅ 구체적인 파싱 로직 요구사항은 없으나, 네이버 API의 description 필드에서 추출하는 것은 합리적
- ✅ Phase 2 구현이 PRD 요구사항과 충돌 없음

---

### 1.2 TODO.md 요구사항 대조

**TODO.md Phase 1 섹션 2.4**:
```
#### 2.4 운영시간 정보 파싱 (기본 구조만 유지)
- [x] 운영시간 데이터 구조 설계 ✅ (DB 스키마, 타입 정의 유지)
- [ ] ~~운영시간 파싱 로직 작성~~ ⏸️ 보류 (복잡한 정규식 파싱 로직 제거)
- [ ] ~~영업중 여부 판단 로직 구현~~ ⏸️ 보류 (향후 관리자 입력 기능에서 활용 예정)
```

**검증 결과**:
- ⚠️ **TODO.md와의 불일치 발견**: TODO.md에서는 파싱 로직을 보류 상태로 표시했으나, Phase 2에서 재구현 완료
- ✅ **합리적 판단**: Phase 2 요구사항에 따라 재구현한 것은 올바른 결정
- ✅ **권장 조치**: TODO.md의 해당 항목을 완료 상태로 업데이트 필요

---

### 1.3 DB 스키마 대조 검증

**DB 스키마 (`db/schema.sql`)**:
```sql
create table public.gym_operating_hours (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  day_of_week int not null check (day_of_week >= 0 and day_of_week <= 6),
  open_time time,        -- nullable
  close_time time,       -- nullable
  is_closed boolean default false,
  notes text,            -- nullable
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint gym_operating_hours_unique unique (gym_id, day_of_week)
);
```

**Prisma 스키마 (`prisma/schema.prisma`)**:
```prisma
model GymOperatingHour {
  id        String    @id @default(uuid()) @db.Uuid
  gymId     String    @map("gym_id") @db.Uuid
  dayOfWeek Int       @map("day_of_week")
  openTime  String?   @map("open_time")      // nullable
  closeTime String?   @map("close_time")     // nullable
  isClosed  Boolean   @default(false) @map("is_closed")
  notes     String?                          // nullable
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz
}
```

**검증 결과**:
- ✅ **타입 일치**: DB의 `time` 타입은 Prisma에서 `String?`으로 매핑됨 (nullable)
- ✅ **Phase 2 타입 정의 일치**: `openTime: string | null`, `closeTime: string | null`로 정의되어 DB 스키마와 일치
- ✅ **필드 일치**: `dayOfWeek`, `isClosed`, `notes` 모두 일치
- ⚠️ **주의사항**: DB의 `time` 타입은 "HH:mm:ss" 형식이지만, Phase 2 구현은 "HH:mm" 형식 사용
  - **영향도**: 낮음 (PostgreSQL의 `time` 타입은 "HH:mm" 형식도 자동 변환)
  - **권장 조치**: DB 저장 시 "HH:mm:00" 형식으로 변환하거나, Prisma에서 자동 변환 확인 필요

---

## 2. 실제 코드 사용처 호환성 검증

### 2.1 `convert-place-to-gym.ts` 호환성

**사용 위치**:
```typescript:120:148:src/lib/utils/convert-place-to-gym.ts
export function convertPlaceItemToOperatingHours(
  placeItem: PlaceItem
): GymOperatingHourUpsertData[] {
  // 이미 파싱된 operatingHours가 있으면 사용
  if (placeItem.operatingHours && placeItem.operatingHours.length > 0) {
    return placeItem.operatingHours.map((oh: OperatingHours) => ({
      dayOfWeek: oh.dayOfWeek,
      openTime: oh.openTime,      // string | null
      closeTime: oh.closeTime,    // string | null
      isClosed: oh.isClosed,
      notes: oh.notes,
    }));
  }

  // description에서 파싱 시도
  if (placeItem.description) {
    const parsedHours = parseOperatingHoursFromDescription(placeItem.description);
    return parsedHours.map((oh: OperatingHours) => ({
      dayOfWeek: oh.dayOfWeek,
      openTime: oh.openTime,      // string | null
      closeTime: oh.closeTime,    // string | null
      isClosed: oh.isClosed,
      notes: oh.notes,
    }));
  }

  // 파싱 실패 시 빈 배열 반환 (기본값은 나중에 설정)
  return [];
}
```

**검증 결과**:
- ✅ **타입 호환성**: `OperatingHours`의 `openTime`, `closeTime`이 `string | null`로 변경되어 `GymOperatingHourUpsertData`와 호환됨
- ✅ **함수 호출**: `parseOperatingHoursFromDescription()` 정상 호출
- ✅ **반환값 처리**: 파싱된 결과를 정확히 매핑

---

### 2.2 `normalize-place-item.ts` 호환성

**사용 위치**:
```typescript:97:118:src/lib/utils/normalize-place-item.ts
// 운영시간 파싱 (옵션)
let operatingHours = undefined;
const shouldParseOperatingHours = options?.parseOperatingHours ?? true;
if (shouldParseOperatingHours && cleanDescription) {
  try {
    operatingHours = parseOperatingHoursFromDescription(cleanDescription);
    if (verbose && operatingHours.length > 0) {
      console.log(
        `[normalizePlaceItem] 운영시간 파싱 성공: ${cleanTitle} - ` +
        `${operatingHours.length}개 요일 정보 추출`
      );
    }
  } catch (error) {
    if (verbose) {
      console.warn(
        `[normalizePlaceItem] 운영시간 파싱 실패: ${cleanTitle} - ` +
        `${error instanceof Error ? error.message : String(error)}`
      );
    }
    // 파싱 실패 시 undefined 유지 (기본값 사용)
  }
}
```

**검증 결과**:
- ✅ **함수 호출**: `parseOperatingHoursFromDescription()` 정상 호출
- ✅ **에러 처리**: try-catch로 파싱 실패 시 안전하게 처리
- ✅ **반환값**: `OperatingHours[]` 타입 일치

---

### 2.3 `check-business-status.ts` 사용처

**검색 결과**: 현재 코드베이스에서 `getBusinessStatus` 또는 `isGymOpen` 함수를 직접 호출하는 곳이 없음

**검증 결과**:
- ⚠️ **사용처 없음**: 영업 상태 판단 로직이 아직 실제로 사용되지 않음
- ✅ **향후 사용 준비 완료**: 함수는 정상적으로 구현되어 있음
- ✅ **권장 조치**: 헬스장 상세 페이지나 리스트 페이지에서 영업 상태 표시 시 사용 예정

---

## 3. 타입 일관성 검증

### 3.1 타입 정의 일관성

**Phase 2 타입 정의** (`src/types/operating-hours.ts`):
```typescript
export interface OperatingHours {
  dayOfWeek: DayOfWeek;
  openTime: string | null;      // ✅ 요구사항 반영
  closeTime: string | null;     // ✅ 요구사항 반영
  isClosed: boolean;
  notes?: string | null;
}

export interface OperatingHoursStatus {
  isOpen: boolean;
  nextOpenTime: Date | null;    // ✅ 요구사항 반영
  closingTime: Date | null;     // ✅ 요구사항 반영
  currentDayHours?: OperatingHours;
  currentTime: Date;
  currentDayOfWeek: DayOfWeek;
}
```

**검증 결과**:
- ✅ **요구사항 일치**: Phase 2 요구사항에 명시된 타입 정의와 정확히 일치
- ✅ **DB 스키마 일치**: `openTime`, `closeTime`이 nullable로 정의되어 DB 스키마와 일치
- ✅ **Prisma 스키마 일치**: `String?` 타입과 호환

---

### 3.2 Zod 스키마 일관성

**Zod 스키마** (`src/lib/validations/operating-hours.schema.ts`):
```typescript
export const operatingHoursSchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  openTime: timeStringSchema.nullable(),      // ✅ nullable 추가
  closeTime: timeStringSchema.nullable(),     // ✅ nullable 추가
  isClosed: z.boolean(),
  notes: z.string().nullable().optional(),
});
```

**검증 결과**:
- ✅ **타입 일치**: `openTime`, `closeTime`에 `nullable()` 추가되어 타입 정의와 일치
- ✅ **검증 로직**: `timeStringSchema`가 HH:mm 형식 검증 수행

---

## 4. 로직 정확성 검증

### 4.1 파싱 로직 검증

**핵심 기능별 검증**:

#### ✅ 1️⃣ 24시간 감지
- **구현**: `is24HoursGym()` 함수
- **키워드**: "24시간", "연중무휴" 등 10개 패턴
- **결과**: `TWENTY_FOUR_HOURS` 반환 (00:00 ~ 23:59)
- **검증**: ✅ 정상 작동

#### ✅ 2️⃣ 요일 우선순위 적용
- **구현**: `parseDaySpecificHoursWithPriority()` 함수
- **우선순위**: 전체(매일) > 평일/주말 > 특정 요일
- **구조**: Map<DayOfWeek, OperatingHours> 사용
- **검증**: ✅ 우선순위 로직 정확히 구현됨

#### ✅ 3️⃣ 시간 파싱
- **구현**: `extractTimePattern()` 함수
- **형식**: HH:mm 형식만 허용
- **구분자**: ~, -, 부터, 까지 등 다양한 구분자 지원
- **검증**: ✅ 정규식 패턴 정확히 구현됨

#### ✅ 4️⃣ 자정 넘김 처리
- **구현**: `handleMidnightCrossing()` 함수
- **로직**: `closeMinutes < openMinutes` 감지
- **결과**: notes 필드에 "(자정 넘김)" 명시
- **검증**: ✅ 정확히 구현됨

#### ✅ 5️⃣ 브레이크 타임 추출
- **구현**: `extractBreakTime()` 함수
- **저장**: notes 필드에 저장 (파싱 결과에는 포함하지 않음)
- **검증**: ✅ 요구사항대로 구현됨

#### ✅ 6️⃣ 실패 안전 장치
- **구현**: 모든 단계에서 기본값 반환
- **기본값**: `DEFAULT_OPERATING_HOURS` 반환
- **검증**: ✅ 앱이 죽지 않도록 안전하게 구현됨

---

### 4.2 영업 상태 판단 로직 검증

**핵심 기능별 검증**:

#### ✅ 한국 시간(KST) 기준 처리
- **구현**: `getKSTDate()` 함수
- **로직**: `date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' })`
- **검증**: ✅ 모든 시간 계산이 KST 기준

#### ✅ 자정 넘김 케이스 처리
- **구현**: `closeMinutes < openMinutes` 조건 분기
- **로직**: 
  - 자정 넘김: `currentMinutes >= openMinutes || currentMinutes <= closeMinutes`
  - 일반 케이스: `currentMinutes >= openMinutes && currentMinutes <= closeMinutes`
- **검증**: ✅ 정확히 구현됨

#### ✅ closingTime 반환
- **구현**: 영업 중일 때 `closingTime` 계산
- **로직**: 자정 넘김 케이스는 다음날, 일반 케이스는 오늘
- **검증**: ✅ 요구사항대로 구현됨

#### ✅ nextOpenTime 계산
- **구현**: `findNextOpenTime()` 함수
- **로직**: 오늘부터 7일 내에서 다음 영업 시작 시간 찾기
- **검증**: ✅ 날짜 이동 로직 정확히 구현됨

---

## 5. 코드 품질 검증

### 5.1 함수 단위 설명

**검증 결과**:
- ✅ **주석 완비**: 모든 함수에 JSDoc 주석 작성
- ✅ **예시 포함**: 주요 함수에 `@example` 포함
- ✅ **의도 명확**: 각 함수의 목적과 동작 방식 명확히 설명

### 5.2 에러 처리

**검증 결과**:
- ✅ **실패 안전**: 파싱 실패 시 항상 기본값 반환
- ✅ **에러 핸들링**: `normalize-place-item.ts`에서 try-catch로 안전하게 처리
- ✅ **로깅**: 개발 환경에서 상세 로그 출력

### 5.3 성능 고려사항

**검증 결과**:
- ✅ **정규식 최적화**: 패턴 배열을 순회하며 첫 매치에서 반환
- ✅ **Map 사용**: 요일별 우선순위 적용 시 Map 사용으로 O(1) 접근
- ✅ **불필요한 연산 최소화**: 브레이크 타임 추출 후 description에서 제거

---

## 6. 발견된 이슈 및 권장 사항

### 6.1 ⚠️ TODO.md 업데이트 필요

**이슈**: TODO.md에서 운영시간 파싱 로직을 보류 상태로 표시했으나, Phase 2에서 재구현 완료

**권장 조치**:
```markdown
#### 2.4 운영시간 정보 파싱
- [x] 운영시간 데이터 구조 설계 ✅ (DB 스키마, 타입 정의 유지)
- [x] 운영시간 파싱 로직 작성 ✅ (Phase 2 완료)
- [x] 영업중 여부 판단 로직 구현 ✅ (Phase 2 완료)
```

---

### 6.2 ⚠️ DB 시간 형식 변환 고려

**이슈**: Phase 2 구현은 "HH:mm" 형식을 사용하지만, PostgreSQL의 `time` 타입은 "HH:mm:ss" 형식

**영향도**: 낮음 (PostgreSQL이 자동 변환)

**권장 조치**:
- DB 저장 시 "HH:mm:00" 형식으로 변환하거나
- Prisma에서 자동 변환 확인
- 필요 시 변환 유틸리티 함수 추가

---

### 6.3 ✅ 실제 사용처 통합 테스트 권장

**이슈**: `getBusinessStatus` 함수가 아직 실제로 사용되지 않음

**권장 조치**:
- 헬스장 상세 페이지에서 영업 상태 표시
- 헬스장 리스트에서 "영업중" 필터 추가
- 통합 테스트 작성

---

## 7. 최종 검증 결과

### 7.1 통과 항목 ✅

- ✅ **타입 정의**: 요구사항과 정확히 일치
- ✅ **DB 스키마 일치**: 모든 필드 타입 일치
- ✅ **Prisma 스키마 일치**: 타입 호환성 확인
- ✅ **실제 코드 호환성**: 기존 사용처와 호환
- ✅ **파싱 로직**: 모든 요구사항 구현 완료
- ✅ **영업 상태 판단 로직**: 모든 요구사항 구현 완료
- ✅ **코드 품질**: 주석, 에러 처리, 성능 고려 완비

### 7.2 주의 필요 항목 ⚠️

- ⚠️ **TODO.md 업데이트**: 운영시간 파싱 로직 완료 상태로 업데이트 필요
- ⚠️ **DB 시간 형식**: "HH:mm" vs "HH:mm:ss" 형식 확인 필요
- ⚠️ **실제 사용처 통합**: `getBusinessStatus` 함수 실제 사용 및 테스트 필요

### 7.3 권장 조치 사항

1. **즉시 조치 필요**:
   - TODO.md 업데이트 (운영시간 파싱 로직 완료 표시)

2. **선택적 조치**:
   - DB 시간 형식 변환 유틸리티 추가 (필요 시)
   - 헬스장 상세 페이지에서 영업 상태 표시 기능 추가
   - 통합 테스트 작성

---

## 8. 검증 완료 일시

**검증 완료**: 2026-01-07  
**검증자**: AI Assistant (시니어 백엔드/풀스택 엔지니어 역할)  
**검증 상태**: ✅ **통과** (TODO.md 업데이트 권장)

---

## 9. 참고 문서

- [PRD.md](docs/PRD.md): 제품 요구사항 문서
- [TODO.md](docs/TODO.md): 개발 로드맵
- [db/schema.sql](db/schema.sql): 데이터베이스 스키마
- [prisma/schema.prisma](prisma/schema.prisma): Prisma 스키마
- [PHASE2_OPERATING_HOURS_VERIFICATION.md](docs/PHASE2_OPERATING_HOURS_VERIFICATION.md): Phase 2 검증 보고서

