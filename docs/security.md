# 보안 강화 체크리스트

**작성일**: 2026-01-07  
**Phase**: 3.3 보안 강화

---

## 1. API 입력 검증 (Zod 스키마)

### ✅ 현재 상태

**구현 완료**: 모든 주요 API 라우트에서 Zod 스키마를 사용하여 입력 검증 수행

**검증 대상**:
- ✅ `/api/gyms/search`: `gymSearchRequestSchema` 사용
- ✅ `/api/rehab/generate`: `mergeRequestSchema` 사용

**검증 항목**:
- 좌표 범위 검증 (한국 영역)
- 반경 범위 검증 (100m ~ 5km)
- 필터 옵션 타입 검증
- 검색어 길이 제한 (1~100자)

**권장 사항**:
- 새로운 API 라우트 추가 시 반드시 Zod 스키마 작성
- 공통 검증 로직은 `src/lib/validations/` 디렉토리에 통합

---

## 2. SQL Injection 방지

### ✅ 현재 상태

**구현 완료**: Prisma를 사용하여 SQL Injection 방지

**안전한 패턴**:
```typescript
// ✅ 안전: Prisma ORM 사용
const gyms = await prisma.gym.findMany({
  where: { name: userInput }
});

// ✅ 안전: $queryRaw with 파라미터 바인딩
const results = await prisma.$queryRaw`
  SELECT * FROM gyms WHERE search_vector @@ plainto_tsquery('simple', ${sanitizedQuery})
`;
```

**주의사항**:
- `$queryRawUnsafe` 사용 금지 (SQL Injection 위험)
- 사용자 입력은 반드시 파라미터 바인딩으로 전달

**검증 결과**:
- ✅ `gym-search.service.ts`: `$queryRaw` 사용, 파라미터 바인딩 적용
- ✅ 모든 Prisma 쿼리: ORM 사용으로 안전

---

## 3. XSS 방지

### ⚠️ 발견된 이슈

**위치**: `src/components/ui/chart.tsx`

**이슈**:
```typescript
// Line 83: dangerouslySetInnerHTML 사용
<style
  dangerouslySetInnerHTML={{
    __html: Object.entries(THEMES)
      .map(([theme, prefix]) => `...`)
      .join('')
  }}
/>
```

**분석**:
- **위험도**: 낮음
- **이유**: 
  - `THEMES` 객체는 하드코딩된 상수
  - 사용자 입력이 포함되지 않음
  - CSS 스타일만 생성 (스크립트 실행 불가)
- **권장 조치**: 현재 상태 유지 (shadcn/ui 컴포넌트 표준 패턴)

**검증 결과**:
- ✅ 다른 컴포넌트에서 `dangerouslySetInnerHTML` 사용 없음
- ✅ API 응답에서 HTML 조각을 그대로 전달하는 패턴 없음

---

## 4. 환경 변수 노출 방지

### ✅ 현재 상태

**구현 완료**: 환경 변수가 올바르게 구분됨

**클라이언트 노출 변수** (`NEXT_PUBLIC_` 접두사):
- ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk Publishable Key
- ✅ `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key
- ✅ `NEXT_PUBLIC_CLERK_SIGN_IN_URL`: 로그인 URL
- ✅ `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`: 리다이렉트 URL
- ✅ `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`: 회원가입 리다이렉트 URL
- ✅ `NEXT_PUBLIC_STORAGE_BUCKET`: Storage 버킷 이름
- ✅ `NEXT_PUBLIC_SITE_URL`: 사이트 URL

**서버 전용 변수** (접두사 없음):
- ✅ `CLERK_SECRET_KEY`: Clerk Secret Key (절대 노출 금지)
- ✅ `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key (절대 노출 금지)

**검증 결과**:
- ✅ `next.config.ts`: 빌드 타임 환경 변수 검증 구현
- ✅ 모든 환경 변수 사용처 확인: 올바른 접두사 사용
- ✅ 민감한 키는 서버 사이드에서만 사용

**권장 사항**:
- `.env.example` 파일에 모든 환경 변수 목록 유지
- `.env` 파일은 `.gitignore`에 포함 확인
- Vercel 배포 시 환경 변수 설정 가이드 문서화 (이미 완료)

---

## 5. Rate Limiting (설계)

### 📋 설계 문서

**현재 상태**: Rate Limiting 미구현

**필요한 경로**:
1. **로그인/회원가입** (`/sign-in`, `/sign-up`)
   - 목적: 무차별 대입 공격 방지
   - 권장 제한: IP당 5회/분, 20회/시간

2. **검색 API** (`/api/gyms/search`)
   - 목적: API 남용 방지
   - 권장 제한: IP당 60회/분, 1000회/일

3. **코스 생성 API** (`/api/rehab/generate`)
   - 목적: 서버 리소스 보호
   - 권장 제한: IP당 10회/분, 100회/일

4. **사용자 동기화 API** (`/api/sync-user`)
   - 목적: 불필요한 동기화 요청 방지
   - 권장 제한: 사용자당 10회/분

---

### 구현 방식 제안

#### 옵션 1: Upstash Redis (권장)

**장점**:
- Edge Runtime 호환
- Vercel과 통합 용이
- 무료 티어 제공

**구현 예시**:
```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const searchRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'), // 60회/분
  analytics: true,
});

export const courseGenerationRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10회/분
  analytics: true,
});
```

**사용 예시**:
```typescript
// src/app/api/gyms/search/route.ts
import { searchRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await searchRateLimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: '요청 한도 초과' },
      { status: 429 }
    );
  }
  
  // ... 기존 로직
}
```

---

#### 옵션 2: Supabase Edge Functions

**장점**:
- Supabase 인프라 활용
- 추가 서비스 불필요

**구현 예시**:
```typescript
// supabase/functions/rate-limit/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  // Rate limiting 로직 구현
  // Supabase KV 또는 PostgreSQL 사용
});
```

---

#### 옵션 3: Middleware 기반 제한

**장점**:
- 간단한 구현
- Edge Runtime에서 실행

**단점**:
- 메모리 기반 (서버 재시작 시 초기화)
- 분산 환경에서 부정확

**구현 예시**:
```typescript
// src/middleware.ts
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}
```

---

### 권장 구현 순서

1. **Phase 1**: Upstash Redis 설정 및 기본 Rate Limiting 구현
2. **Phase 2**: 검색 API에 Rate Limiting 적용
3. **Phase 3**: 코스 생성 API에 Rate Limiting 적용
4. **Phase 4**: 로그인/회원가입 Rate Limiting 적용 (Clerk 기본 기능 활용 가능)

---

## 6. 추가 보안 권장사항

### CORS 설정

**현재 상태**: Next.js 기본 CORS 설정 사용

**권장 사항**:
- 프로덕션 환경에서 특정 도메인만 허용하도록 설정
- API 라우트에서 CORS 헤더 명시적 설정

```typescript
// src/app/api/**/route.ts
export async function GET(request: NextRequest) {
  const response = NextResponse.json(data);
  
  // CORS 헤더 설정
  response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return response;
}
```

---

### HTTPS 강제

**현재 상태**: Vercel 배포 시 자동 HTTPS 적용

**권장 사항**:
- 프로덕션 환경에서 HTTP → HTTPS 리다이렉트 확인
- `next.config.ts`에서 `forceHttps` 옵션 검토

---

### 보안 헤더

**권장 사항**:
- `next.config.ts`에서 보안 헤더 설정

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

---

## 7. 보안 체크리스트 요약

### ✅ 완료 항목

- ✅ API 입력 검증 (Zod 스키마)
- ✅ SQL Injection 방지 (Prisma 사용)
- ✅ 환경 변수 노출 방지 (접두사 구분)
- ✅ XSS 방지 (위험도 낮은 사용만 확인)

### 📋 권장 사항

- ⏭️ Rate Limiting 구현 (Upstash Redis 권장)
- ⏭️ CORS 설정 명시화
- ⏭️ 보안 헤더 추가

---

## 8. 참고 자료

- [Next.js 보안 가이드](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Prisma 보안 가이드](https://www.prisma.io/docs/guides/performance-and-optimization/query-optimization)
- [Upstash Rate Limiting](https://upstash.com/docs/redis/features/ratelimit)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

