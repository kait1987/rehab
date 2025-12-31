# 1.3 부위 Bank 데이터 준비 - 상세 개발 플랜

## 개요
부위별 추천 운동 매핑 및 금기 운동을 정의하는 "부위 Bank" 시스템을 구축합니다. 이는 특정 부위에 대한 추천 운동과 금기 운동을 관리하는 데이터 구조입니다.

## 참고 문서
- `docs/TODO.md` (68-72줄): 작업 요구사항
- `prisma/schema.prisma`: 기존 데이터베이스 스키마 (BodyPart, ExerciseTemplate 모델)
- `types/exercise-template.ts`: 1.2 작업에서 사용한 타입 정의 패턴
- `lib/validations/exercise-template.schema.ts`: 1.2 작업에서 사용한 Zod 스키마 패턴
- `lib/validations/validate-template.ts`: 1.2 작업에서 사용한 검증 로직 패턴
- `scripts/upload-templates.ts`: 1.2 작업에서 사용한 업로드 스크립트 패턴

---

## 1. 데이터베이스 테이블 생성

### 1.1 마이그레이션 파일 생성
**파일**: `supabase/migrations/20250104000000_create_body_part_bank_tables.sql`

**작업 내용**:

#### 1.1.1 `body_part_exercise_mappings` 테이블
```sql
CREATE TABLE public.body_part_exercise_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  body_part_id uuid NOT NULL REFERENCES public.body_parts(id) ON DELETE CASCADE,
  exercise_template_id uuid NOT NULL REFERENCES public.exercise_templates(id) ON DELETE CASCADE,
  priority int NOT NULL, -- 낮을수록 우선순위 높음
  intensity_level int CHECK (intensity_level >= 1 AND intensity_level <= 4), -- 1-4 범위, nullable 허용
  pain_level_range varchar(20), -- 예: '1-2', '3-4', '5', 'all'
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT body_part_exercise_mappings_unique UNIQUE (body_part_id, exercise_template_id, pain_level_range)
);

COMMENT ON TABLE public.body_part_exercise_mappings IS '부위별 추천 운동 매핑';
COMMENT ON COLUMN public.body_part_exercise_mappings.priority IS '우선순위 (낮을수록 높은 우선순위)';
COMMENT ON COLUMN public.body_part_exercise_mappings.intensity_level IS '권장 강도 레벨 (1-4)';
COMMENT ON COLUMN public.body_part_exercise_mappings.pain_level_range IS '통증 정도 범위 (예: 1-2, 3-4, 5, all)';

CREATE INDEX idx_body_part_exercise_mappings_body_part_id ON public.body_part_exercise_mappings(body_part_id);
CREATE INDEX idx_body_part_exercise_mappings_exercise_template_id ON public.body_part_exercise_mappings(exercise_template_id);
CREATE INDEX idx_body_part_exercise_mappings_priority ON public.body_part_exercise_mappings(priority);
CREATE INDEX idx_body_part_exercise_mappings_pain_level_range ON public.body_part_exercise_mappings(pain_level_range);

DROP TRIGGER IF EXISTS handle_body_part_exercise_mappings_updated_at ON public.body_part_exercise_mappings;
CREATE TRIGGER handle_body_part_exercise_mappings_updated_at
  BEFORE UPDATE ON public.body_part_exercise_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

#### 1.1.2 `body_part_contraindications` 테이블
```sql
CREATE TABLE public.body_part_contraindications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  body_part_id uuid NOT NULL REFERENCES public.body_parts(id) ON DELETE CASCADE,
  exercise_template_id uuid NOT NULL REFERENCES public.exercise_templates(id) ON DELETE CASCADE,
  pain_level_min int CHECK (pain_level_min >= 1 AND pain_level_min <= 5), -- 이 이상일 때 금기, NULL이면 항상 금기
  reason text, -- 금기 사유
  severity varchar(20) NOT NULL DEFAULT 'warning' CHECK (severity IN ('warning', 'strict')), -- 'warning' | 'strict'
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT body_part_contraindications_unique UNIQUE (body_part_id, exercise_template_id, pain_level_min)
);

COMMENT ON TABLE public.body_part_contraindications IS '부위별 금기 운동';
COMMENT ON COLUMN public.body_part_contraindications.pain_level_min IS '최소 통증 정도 (이 이상일 때 금기, NULL이면 항상 금기)';
COMMENT ON COLUMN public.body_part_contraindications.reason IS '금기 사유';
COMMENT ON COLUMN public.body_part_contraindications.severity IS '금기 심각도 (warning: 경고, strict: 엄격)';

CREATE INDEX idx_body_part_contraindications_body_part_id ON public.body_part_contraindications(body_part_id);
CREATE INDEX idx_body_part_contraindications_exercise_template_id ON public.body_part_contraindications(exercise_template_id);
CREATE INDEX idx_body_part_contraindications_pain_level_min ON public.body_part_contraindications(pain_level_min);

DROP TRIGGER IF EXISTS handle_body_part_contraindications_updated_at ON public.body_part_contraindications;
CREATE TRIGGER handle_body_part_contraindications_updated_at
  BEFORE UPDATE ON public.body_part_contraindications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### 1.2 Prisma 스키마 업데이트
**파일**: `prisma/schema.prisma`

**작업 내용**:

#### 1.2.1 `BodyPartExerciseMapping` 모델 추가
```prisma
model BodyPartExerciseMapping {
  id                String    @id @default(uuid()) @db.Uuid
  bodyPartId        String    @map("body_part_id") @db.Uuid
  exerciseTemplateId String    @map("exercise_template_id") @db.Uuid
  priority          Int
  intensityLevel    Int?      @map("intensity_level")
  painLevelRange    String?   @map("pain_level_range") @db.VarChar(20)
  isActive          Boolean   @default(true) @map("is_active")
  createdAt         DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  // Relations
  bodyPart        BodyPart        @relation(fields: [bodyPartId], references: [id], onDelete: Cascade)
  exerciseTemplate ExerciseTemplate @relation(fields: [exerciseTemplateId], references: [id], onDelete: Cascade)

  @@unique([bodyPartId, exerciseTemplateId, painLevelRange], map: "body_part_exercise_mappings_unique")
  @@index([bodyPartId], map: "idx_body_part_exercise_mappings_body_part_id")
  @@index([exerciseTemplateId], map: "idx_body_part_exercise_mappings_exercise_template_id")
  @@index([priority], map: "idx_body_part_exercise_mappings_priority")
  @@index([painLevelRange], map: "idx_body_part_exercise_mappings_pain_level_range")
  @@map("body_part_exercise_mappings")
}
```

#### 1.2.2 `BodyPartContraindication` 모델 추가
```prisma
model BodyPartContraindication {
  id                String    @id @default(uuid()) @db.Uuid
  bodyPartId        String    @map("body_part_id") @db.Uuid
  exerciseTemplateId String    @map("exercise_template_id") @db.Uuid
  painLevelMin      Int?      @map("pain_level_min")
  reason            String?
  severity          String    @default("warning") @db.VarChar(20)
  isActive          Boolean   @default(true) @map("is_active")
  createdAt         DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  // Relations
  bodyPart        BodyPart        @relation(fields: [bodyPartId], references: [id], onDelete: Cascade)
  exerciseTemplate ExerciseTemplate @relation(fields: [exerciseTemplateId], references: [id], onDelete: Cascade)

  @@unique([bodyPartId, exerciseTemplateId, painLevelMin], map: "body_part_contraindications_unique")
  @@index([bodyPartId], map: "idx_body_part_contraindications_body_part_id")
  @@index([exerciseTemplateId], map: "idx_body_part_contraindications_exercise_template_id")
  @@index([painLevelMin], map: "idx_body_part_contraindications_pain_level_min")
  @@map("body_part_contraindications")
}
```

#### 1.2.3 `BodyPart` 모델에 relations 추가
```prisma
model BodyPart {
  // ... 기존 필드들 ...
  
  // Relations
  exerciseTemplates            ExerciseTemplate[]
  userPainProfiles             UserPainProfile[]
  exerciseMappings             BodyPartExerciseMapping[]  // 추가
  contraindications            BodyPartContraindication[] // 추가
}
```

#### 1.2.4 `ExerciseTemplate` 모델에 relations 추가
```prisma
model ExerciseTemplate {
  // ... 기존 필드들 ...
  
  // Relations
  bodyPart                  BodyPart                  @relation(fields: [bodyPartId], references: [id])
  exerciseEquipmentMappings ExerciseEquipmentMapping[]
  courseExercises            CourseExercise[]
  bodyPartExerciseMappings   BodyPartExerciseMapping[]  // 추가
  bodyPartContraindications  BodyPartContraindication[] // 추가
}
```

---

## 2. TypeScript 타입 정의

### 2.1 타입 파일 생성
**파일**: `types/body-part-bank.ts`

**작업 내용**:
```typescript
/**
 * 부위 Bank 관련 타입 정의
 * 
 * 부위별 추천 운동 매핑 및 금기 운동 정의를 위한 JSON 입력 형식을 정의합니다.
 */

/**
 * 부위별 추천 운동 매핑 입력 타입
 * JSON 파일에서 읽어올 때 사용하는 형식입니다.
 * body_part_id와 exercise_template_id 대신 name을 사용하여
 * 업로드 시점에 UUID로 변환합니다.
 */
export interface BodyPartExerciseMappingInput {
  /** 부위 이름 (body_parts.name 기준, 필수) */
  bodyPartName: string;
  /** 운동 템플릿 이름 (exercise_templates.name 기준, 필수) */
  exerciseTemplateName: string;
  /** 우선순위 (낮을수록 우선순위 높음, 필수) */
  priority: number;
  /** 권장 강도 레벨 (1-4, 선택) */
  intensity_level?: number;
  /** 통증 정도 범위 (예: '1-2', '3-4', '5', 'all', 선택) */
  pain_level_range?: string;
  /** 활성화 여부 (선택, 기본값 true) */
  is_active?: boolean;
}

/**
 * 부위별 금기 운동 입력 타입
 * JSON 파일에서 읽어올 때 사용하는 형식입니다.
 * body_part_id와 exercise_template_id 대신 name을 사용하여
 * 업로드 시점에 UUID로 변환합니다.
 */
export interface BodyPartContraindicationInput {
  /** 부위 이름 (body_parts.name 기준, 필수) */
  bodyPartName: string;
  /** 운동 템플릿 이름 (exercise_templates.name 기준, 필수) */
  exerciseTemplateName: string;
  /** 최소 통증 정도 (이 이상일 때 금기, NULL이면 항상 금기, 선택) */
  pain_level_min?: number;
  /** 금기 사유 (선택) */
  reason?: string;
  /** 금기 심각도 ('warning' | 'strict', 선택, 기본값 'warning') */
  severity?: 'warning' | 'strict';
  /** 활성화 여부 (선택, 기본값 true) */
  is_active?: boolean;
}

/**
 * 부위 Bank 전체 입력 타입
 * 특정 부위에 대한 추천 운동 및 금기 운동 목록을 포함합니다.
 */
export interface BodyPartBankInput {
  /** 부위 이름 (body_parts.name 기준, 필수) */
  bodyPartName: string;
  /** 추천 운동 매핑 목록 */
  recommended: BodyPartExerciseMappingInput[];
  /** 금기 운동 목록 */
  contraindications: BodyPartContraindicationInput[];
}

/**
 * 검증 결과 타입 (재사용)
 */
export interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings?: string[];
}
```

---

## 3. Zod 스키마 정의

### 3.1 스키마 파일 생성
**파일**: `lib/validations/body-part-bank.schema.ts`

**작업 내용**:
```typescript
import { z } from "zod";
import type { 
  BodyPartExerciseMappingInput, 
  BodyPartContraindicationInput,
  BodyPartBankInput 
} from "@/types/body-part-bank";

/**
 * 부위별 추천 운동 매핑 Zod 스키마
 */
export const bodyPartExerciseMappingSchema = z.object({
  bodyPartName: z
    .string()
    .min(1, "부위 이름은 필수입니다.")
    .max(50, "부위 이름은 50자 이하여야 합니다."),
  
  exerciseTemplateName: z
    .string()
    .min(1, "운동 템플릿 이름은 필수입니다.")
    .max(200, "운동 템플릿 이름은 200자 이하여야 합니다."),
  
  priority: z
    .number()
    .int("우선순위는 정수여야 합니다.")
    .positive("우선순위는 0보다 큰 값이어야 합니다."),
  
  intensity_level: z
    .number()
    .int("강도 레벨은 정수여야 합니다.")
    .min(1, "강도 레벨은 1 이상이어야 합니다.")
    .max(4, "강도 레벨은 4 이하여야 합니다.")
    .optional(),
  
  pain_level_range: z
    .string()
    .regex(/^(\d-\d|\d|all)$/, "통증 정도 범위 형식이 올바르지 않습니다. (예: '1-2', '3-4', '5', 'all')")
    .optional(),
  
  is_active: z
    .boolean()
    .optional()
    .default(true),
}) satisfies z.ZodType<BodyPartExerciseMappingInput>;

/**
 * 부위별 금기 운동 Zod 스키마
 */
export const bodyPartContraindicationSchema = z.object({
  bodyPartName: z
    .string()
    .min(1, "부위 이름은 필수입니다.")
    .max(50, "부위 이름은 50자 이하여야 합니다."),
  
  exerciseTemplateName: z
    .string()
    .min(1, "운동 템플릿 이름은 필수입니다.")
    .max(200, "운동 템플릿 이름은 200자 이하여야 합니다."),
  
  pain_level_min: z
    .number()
    .int("통증 정도는 정수여야 합니다.")
    .min(1, "통증 정도는 1 이상이어야 합니다.")
    .max(5, "통증 정도는 5 이하여야 합니다.")
    .optional(),
  
  reason: z
    .string()
    .max(1000, "금기 사유는 1000자 이하여야 합니다.")
    .optional(),
  
  severity: z
    .enum(['warning', 'strict'], {
      errorMap: () => ({ message: "심각도는 'warning' 또는 'strict'만 허용됩니다." })
    })
    .optional()
    .default('warning'),
  
  is_active: z
    .boolean()
    .optional()
    .default(true),
}) satisfies z.ZodType<BodyPartContraindicationInput>;

/**
 * 부위 Bank 전체 Zod 스키마
 */
export const bodyPartBankSchema = z.object({
  bodyPartName: z
    .string()
    .min(1, "부위 이름은 필수입니다.")
    .max(50, "부위 이름은 50자 이하여야 합니다."),
  
  recommended: z
    .array(bodyPartExerciseMappingSchema)
    .min(0, "추천 운동 목록은 배열이어야 합니다."),
  
  contraindications: z
    .array(bodyPartContraindicationSchema)
    .min(0, "금기 운동 목록은 배열이어야 합니다."),
}) satisfies z.ZodType<BodyPartBankInput>;
```

---

## 4. 검증 로직 구현

### 4.1 검증 함수 파일 생성
**파일**: `lib/validations/validate-body-part-bank.ts`

**작업 내용**:
```typescript
import { bodyPartBankSchema } from "./body-part-bank.schema";
import type { BodyPartBankInput, ValidationResult } from "@/types/body-part-bank";
import { prisma } from "@/lib/prisma/client";

/**
 * 부위 Bank 데이터 검증 함수
 * 
 * Zod 스키마 검증과 데이터베이스 제약조건 검증을 수행합니다.
 * 
 * @param input 검증할 부위 Bank 입력 데이터 배열
 * @returns 검증 결과
 */
export async function validateBodyPartBank(
  input: BodyPartBankInput[]
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Zod 스키마 검증
  for (let i = 0; i < input.length; i++) {
    const item = input[i];
    const schemaResult = bodyPartBankSchema.safeParse(item);
    
    if (!schemaResult.success) {
      schemaResult.error.errors.forEach((err) => {
        errors.push(`[${i}] ${item.bodyPartName}: ${err.path.join(".")} - ${err.message}`);
      });
      continue;
    }

    // 2. 데이터베이스 제약조건 검증
    // body_part 존재 여부 확인
    const bodyPart = await prisma.bodyPart.findUnique({
      where: { name: item.bodyPartName },
    });

    if (!bodyPart) {
      errors.push(`[${i}] 부위 '${item.bodyPartName}'가 데이터베이스에 존재하지 않습니다.`);
    }

    // exercise_templates 존재 여부 확인 (recommended)
    for (const rec of item.recommended) {
      const template = await prisma.exerciseTemplate.findFirst({
        where: { name: rec.exerciseTemplateName },
      });

      if (!template) {
        errors.push(`[${i}] 추천 운동 '${rec.exerciseTemplateName}'가 데이터베이스에 존재하지 않습니다.`);
      }
    }

    // exercise_templates 존재 여부 확인 (contraindications)
    for (const contra of item.contraindications) {
      const template = await prisma.exerciseTemplate.findFirst({
        where: { name: contra.exerciseTemplateName },
      });

      if (!template) {
        errors.push(`[${i}] 금기 운동 '${contra.exerciseTemplateName}'가 데이터베이스에 존재하지 않습니다.`);
      }
    }

    // 3. 비즈니스 로직 검증
    // priority 중복 체크 (같은 부위 내에서)
    const priorities = item.recommended.map(r => r.priority);
    const uniquePriorities = new Set(priorities);
    if (priorities.length !== uniquePriorities.size) {
      warnings.push(`[${i}] 부위 '${item.bodyPartName}'의 추천 운동에서 priority 중복이 있습니다.`);
    }

    // pain_level_range 형식 검증 (Zod에서 이미 검증되지만 명시적으로)
    for (const rec of item.recommended) {
      if (rec.pain_level_range && !/^(\d-\d|\d|all)$/.test(rec.pain_level_range)) {
        errors.push(`[${i}] 추천 운동 '${rec.exerciseTemplateName}'의 pain_level_range 형식이 올바르지 않습니다.`);
      }
    }
  }

  return {
    success: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
```

---

## 5. 데이터 생성 스크립트

### 5.1 JSON 생성 스크립트
**파일**: `scripts/generate-body-part-bank.ts`

**작업 내용**:
- 기존 `exercise_templates` 테이블에서 데이터 읽기 (Prisma 사용)
- 10개 부위 각각에 대해:
  - 추천 운동 3-5개 선택 (해당 부위의 운동 템플릿 중에서 선택)
  - 금기 운동 2-4개 선택 (다른 부위의 고강도 운동 등)
- `priority`는 1부터 순차 증가
- `pain_level_range`, `pain_level_min`, `severity`는 간단한 규칙으로 채우기
- 결과를 `templates/body-part-bank-30.json` 파일로 저장

**JSON 구조 예시**:
```json
[
  {
    "bodyPartName": "허리",
    "recommended": [
      {
        "exerciseTemplateName": "허리 스트레칭 1",
        "priority": 1,
        "intensity_level": 2,
        "pain_level_range": "1-2",
        "is_active": true
      }
    ],
    "contraindications": [
      {
        "exerciseTemplateName": "고강도 허리 운동",
        "pain_level_min": 4,
        "severity": "strict",
        "reason": "통증이 심할 때는 피해야 함",
        "is_active": true
      }
    ]
  }
]
```

---

## 6. 업로드 스크립트

### 6.1 업로드 스크립트 생성
**파일**: `scripts/upload-body-part-bank.ts`

**작업 내용**:
- `templates/body-part-bank-30.json` 파일 읽기
- `validateBodyPartBank` 호출로 먼저 검증
- 통과한 데이터만 대상으로 트랜잭션 처리:
  - `bodyPartName` → `body_part_id` 매핑 (Prisma로 조회)
  - `exerciseTemplateName` → `exercise_template_id` 매핑 (Prisma로 조회)
  - `body_part_exercise_mappings`에 INSERT (Prisma 사용)
  - `body_part_contraindications`에 INSERT (Prisma 사용)
- 중복 방지: UNIQUE 제약조건 위반 시 건너뛰고 로그 출력
- 처리 요약 출력 (생성/스킵/에러 개수)

---

## 7. 검증 CLI 스크립트

### 7.1 검증 스크립트 생성
**파일**: `scripts/validate-body-part-bank.ts`

**작업 내용**:
- `templates/body-part-bank-30.json` 파일 읽기
- `validateBodyPartBank` 호출
- 전체/성공/실패 개수 출력
- 실패 항목별 에러 메시지 출력

---

## 8. package.json 스크립트 추가

### 8.1 스크립트 명령어 추가
**파일**: `package.json`

**작업 내용**:
```json
{
  "scripts": {
    "body-part-bank:generate": "tsx scripts/generate-body-part-bank.ts",
    "body-part-bank:validate": "tsx scripts/validate-body-part-bank.ts",
    "body-part-bank:upload": "tsx scripts/upload-body-part-bank.ts"
  }
}
```

---

## 9. 트리거 업데이트

### 9.1 트리거 파일 업데이트
**파일**: `supabase/migrations/20250102000008_create_triggers.sql`

**작업 내용**:
- 파일 끝에 다음 트리거 추가:
```sql
DROP TRIGGER IF EXISTS handle_body_part_exercise_mappings_updated_at ON public.body_part_exercise_mappings;
CREATE TRIGGER handle_body_part_exercise_mappings_updated_at
  BEFORE UPDATE ON public.body_part_exercise_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_body_part_contraindications_updated_at ON public.body_part_contraindications;
CREATE TRIGGER handle_body_part_contraindications_updated_at
  BEFORE UPDATE ON public.body_part_contraindications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

---

## 10. 시드 마이그레이션 파일 (선택)

### 10.1 시드 마이그레이션 파일 생성
**파일**: `supabase/migrations/20250104000001_insert_body_part_bank.sql`

**작업 내용**:
- 주석 처리된 예시 INSERT 문 포함
- 주석으로 "실제 시드는 scripts/upload-body-part-bank.ts 사용" 명시

---

## 실행 순서

1. 마이그레이션 파일 생성 및 적용
   ```bash
   supabase migration new create_body_part_bank_tables
   # 파일 작성 후
   supabase db reset  # 로컬 DB 재설정
   ```

2. Prisma 스키마 업데이트 및 생성
   ```bash
   pnpm prisma:generate
   ```

3. 타입 및 스키마 파일 생성

4. 검증 로직 구현

5. 데이터 생성 스크립트 실행
   ```bash
   pnpm body-part-bank:generate
   ```

6. 검증 스크립트 실행
   ```bash
   pnpm body-part-bank:validate
   ```

7. 업로드 스크립트 실행
   ```bash
   pnpm body-part-bank:upload
   ```

---

## 주의사항

- 모든 FK는 `ON DELETE CASCADE` 정책 사용
- `pain_level_range`는 NULL 허용 (NULL이면 모든 통증 레벨에 적용)
- `pain_level_min`은 NULL 허용 (NULL이면 항상 금기)
- UNIQUE 제약조건은 NULL을 고려하여 설계 (PostgreSQL의 NULL 처리 방식)
- 트리거는 기존 `handle_updated_at()` 함수 재사용
- TypeScript strict 모드 준수
- 기존 코드 스타일 및 네이밍 컨벤션 준수 (kebab-case 파일명, camelCase 변수명)
- 스크립트 실행 도구: `tsx` 사용

---

## 파일 생성 목록

1. `supabase/migrations/20250104000000_create_body_part_bank_tables.sql`
2. `prisma/schema.prisma` (업데이트)
3. `types/body-part-bank.ts`
4. `lib/validations/body-part-bank.schema.ts`
5. `lib/validations/validate-body-part-bank.ts`
6. `scripts/generate-body-part-bank.ts`
7. `scripts/upload-body-part-bank.ts`
8. `scripts/validate-body-part-bank.ts`
9. `package.json` (업데이트)
10. `supabase/migrations/20250102000008_create_triggers.sql` (업데이트)
11. `supabase/migrations/20250104000001_insert_body_part_bank.sql` (선택)

---

플랜 파일을 `docs/PLAN_1.3_BODY_PART_BANK.md`에 저장했습니다. 윈도우에서 확인하실 수 있습니다.

승인해 주시면 개발을 진행하겠습니다.

