# Next.js 15 프로젝트 구조 문서

> REHAB 재활운동 어플리케이션 - Next.js 15 프로젝트 구조 및 설정 가이드

## 프로젝트 개요

- **프레임워크**: Next.js 15.5.7
- **React 버전**: 18.2.0
- **TypeScript**: 5.x
- **패키지 매니저**: pnpm (>=8.0.0)
- **Node.js**: >=22.0.0 <25.0.0

## 프로젝트 구조

```
nextjs-supabase-boilerplate-main/
├── src/                          # 소스 코드 디렉토리
│   ├── app/                      # App Router (Next.js 15)
│   │   ├── layout.tsx           # Root Layout
│   │   ├── page.tsx              # 홈페이지
│   │   ├── globals.css           # 전역 스타일 (Tailwind CSS v4)
│   │   ├── api/                  # API Routes
│   │   │   ├── body-parts/       # 부위별 운동 조회 API
│   │   │   ├── gyms/             # 헬스장 검색 API
│   │   │   ├── rehab/            # 재활 코스 생성 API
│   │   │   └── ...
│   │   ├── auth/                 # 인증 관련 페이지
│   │   ├── login/                # 로그인 페이지
│   │   ├── my/                   # 마이페이지
│   │   └── ...
│   ├── components/               # React 컴포넌트
│   │   ├── ui/                   # shadcn/ui 컴포넌트
│   │   ├── providers/            # Context Providers
│   │   │   ├── client-providers.tsx
│   │   │   ├── theme-provider.tsx
│   │   │   └── sync-user-provider.tsx
│   │   ├── Navbar.tsx
│   │   ├── home-hero.tsx
│   │   └── ...
│   ├── lib/                      # 유틸리티 및 서비스
│   │   ├── algorithms/           # 알고리즘 (병합, 난이도 조정 등)
│   │   ├── services/             # 비즈니스 로직 서비스
│   │   ├── utils/                # 유틸리티 함수
│   │   ├── validations/          # Zod 스키마
│   │   ├── constants/            # 상수 정의
│   │   ├── prisma/               # Prisma 클라이언트
│   │   └── supabase/             # Supabase 클라이언트
│   ├── hooks/                    # Custom React Hooks
│   ├── actions/                  # Server Actions
│   └── types/                    # TypeScript 타입 정의
├── db.sql                        # 데이터베이스 스키마
├── prisma/                       # Prisma 설정
├── docs/                         # 문서
├── tsconfig.json                 # TypeScript 설정
├── package.json                  # 패키지 의존성
└── .env                          # 환경 변수 (로컬)
```

## App Router 구조

Next.js 15는 **App Router**를 사용합니다. `src/app/` 디렉토리가 라우팅의 중심입니다.

### 라우팅 규칙

- `src/app/page.tsx` → `/` (홈페이지)
- `src/app/login/page.tsx` → `/login`
- `src/app/my/page.tsx` → `/my`
- `src/app/api/gyms/search/route.ts` → `/api/gyms/search` (API Route)

### 주요 파일

#### Root Layout (`src/app/layout.tsx`)

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import { ClientProviders } from "@/components/providers/client-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "REHAB",
  description: "동네 기반 재활 헬스장 추천 & 맞춤형 재활 코스 생성 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClientProviders>
          <Navbar />
          <div className="relative">{children}</div>
        </ClientProviders>
      </body>
    </html>
  );
}
```

**특징**:
- Server Component (기본값)
- `ClientProviders`로 클라이언트 컴포넌트 래핑
- Google Fonts (Geist, Geist Mono) 사용

#### API Routes

API Routes는 `src/app/api/` 디렉토리에 위치합니다.

**예시**: `src/app/api/rehab/generate/route.ts`
- `GET`, `POST`, `PUT`, `DELETE` 등 HTTP 메서드 지원
- `NextRequest`, `NextResponse` 사용

## TypeScript 설정

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "jsx": "preserve"
  }
}
```

**주요 설정**:
- `@/*` → `src/*` 경로 별칭
- `jsx: "preserve"` → Next.js가 JSX 처리

### 경로 별칭 사용 예시

```typescript
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma/client";
import type { MergeRequest } from "@/types/body-part-merge";
```

## Server Components vs Client Components

### Server Components (기본)

- 서버에서 렌더링
- 데이터베이스 직접 접근 가능
- 클라이언트 번들 크기 감소
- `async/await` 사용 가능

**예시**: `src/app/page.tsx`

```typescript
export default async function Home() {
  // 서버에서 데이터 페칭
  const data = await fetchData();
  return <div>{data}</div>;
}
```

### Client Components

- `"use client"` 지시어 필요
- 브라우저에서 실행
- React Hooks 사용 가능
- 사용자 인터랙션 처리

**예시**: `src/components/Navbar.tsx`

```typescript
"use client";

import { useUser } from "@clerk/nextjs";

export default function Navbar() {
  const { user } = useUser();
  return <nav>...</nav>;
}
```

## Next.js 15 주요 기능

### 1. Async Request APIs

Next.js 15에서는 Request 객체를 비동기로 처리합니다.

```typescript
// ✅ Next.js 15 방식
const cookieStore = await cookies();
const headersList = await headers();
const params = await props.params;
const searchParams = await props.searchParams;
```

### 2. Metadata API

```typescript
export const metadata: Metadata = {
  title: "REHAB",
  description: "동네 기반 재활 헬스장 추천 & 맞춤형 재활 코스 생성 서비스",
};
```

### 3. Route Handlers

```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "Hello" });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ received: body });
}
```

## 주요 디렉토리 설명

### `src/app/`

App Router의 핵심 디렉토리입니다.

- **페이지**: `page.tsx` 파일로 라우트 생성
- **레이아웃**: `layout.tsx` 파일로 공통 레이아웃 정의
- **API Routes**: `route.ts` 파일로 API 엔드포인트 생성
- **에러 처리**: `error.tsx`, `not-found.tsx`

### `src/components/`

재사용 가능한 React 컴포넌트입니다.

- **`ui/`**: shadcn/ui 기반 UI 컴포넌트
- **`providers/`**: Context API Providers
- **기타**: 비즈니스 로직 컴포넌트

### `src/lib/`

유틸리티 함수, 서비스, 설정 파일입니다.

- **`algorithms/`**: 비즈니스 로직 알고리즘
- **`services/`**: 외부 API 통신 서비스
- **`utils/`**: 순수 함수 유틸리티
- **`validations/`**: Zod 스키마
- **`constants/`**: 상수 정의
- **`prisma/`**: Prisma 클라이언트
- **`supabase/`**: Supabase 클라이언트

### `src/hooks/`

Custom React Hooks입니다.

- `use-sync-user.ts`: Clerk 사용자 동기화
- `use-mobile.ts`: 모바일 감지

### `src/actions/`

Server Actions입니다.

- `pain-check.ts`: 통증 프로필 저장

### `src/types/`

TypeScript 타입 정의입니다.

- `body-part-merge.ts`: 부위 병합 관련 타입
- `gym-search.ts`: 헬스장 검색 관련 타입
- `exercise-template.ts`: 운동 템플릿 타입

## 인증 구조

### Clerk 인증

- **클라이언트**: `useUser()`, `useAuth()` 훅 사용
- **서버**: Server Actions에서 `userId`를 파라미터로 받음
- **Middleware**: 사용하지 않음 (App Router 기반 인증)

### 사용자 동기화

- `SyncUserProvider`: Clerk 사용자를 Supabase `users` 테이블에 동기화
- `use-sync-user.ts`: 동기화 로직

## 데이터베이스

### Prisma ORM

- **스키마**: `prisma/schema.prisma`
- **클라이언트**: `src/lib/prisma/client.ts`
- **마이그레이션**: `prisma migrate dev`

### Supabase

- **클라이언트**: `src/lib/supabase/client.ts` (공개 데이터)
- **서버**: `src/lib/supabase/server.ts` (서버 사이드)
- **서비스 역할**: `src/lib/supabase/service-role.ts` (관리자 권한)

## 스타일링

### Tailwind CSS v4

- **설정**: `src/app/globals.css`에 `@import "tailwindcss"`
- **테마**: CSS 변수 기반 (`:root`에 정의)
- **컴포넌트**: shadcn/ui 사용

### 테마 시스템

- **기본 테마**: 다크 모드 (고정)
- **색상 팔레트**: 테라코타 & 크림 베이지 (다크 모드 기반)
- **테마 토글**: 제거됨 (다크 모드만 사용)

## 개발 명령어

```bash
# 개발 서버 실행
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start

# 린팅
pnpm lint

# Prisma 생성
pnpm prisma:generate

# Prisma 마이그레이션
pnpm prisma:migrate:dev
```

## 환경 변수

`.env` 파일에 다음 변수들이 필요합니다:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database
DATABASE_URL=
DIRECT_URL=
```

## 참고 문서

- [Next.js 15 공식 문서](https://nextjs.org/docs)
- [App Router 가이드](https://nextjs.org/docs/app)
- [React Server Components](https://react.dev/reference/rsc/server-components)
- [PRD.md](./PRD.md): 제품 요구사항 문서
- [db.sql](../db.sql): 데이터베이스 스키마

## 주의사항

1. **Server Components 기본**: 컴포넌트는 기본적으로 Server Component입니다.
2. **클라이언트 기능 필요 시**: `"use client"` 지시어 추가 필수
3. **Middleware**: `src/middleware.ts`에서 Clerk 인증 미들웨어 사용
4. **경로 별칭**: `@/`는 `src/`를 가리킵니다.
5. **비동기 처리**: Next.js 15에서는 Request 객체를 비동기로 처리합니다.
6. **다크 모드 기본**: 다크 모드가 기본 테마이며, 라이트 모드 토글 기능이 없습니다.

