This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 환경 변수 설정

프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# Supabase 환경 변수
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_STORAGE_BUCKET=study

# Prisma 데이터베이스 연결 (Prisma 7 필수)
# Supabase PostgreSQL 연결 문자열 사용
# 형식: postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@[YOUR_PROJECT_REF].supabase.co:5432/postgres?sslmode=require

# 네이버 API 환경 변수 (선택사항)
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_naver_map_client_id
```

**환경 변수 값 확인 방법:**

**Supabase:**
1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. Settings > API 메뉴로 이동
4. `Project URL`과 `anon public` 키를 복사하여 `.env` 파일에 입력
5. `service_role` 키는 **절대 공개하지 마세요** (서버 사이드 전용)

**Prisma DATABASE_URL:**
1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. Settings > Database 메뉴로 이동
4. `Connection string` 섹션에서 `URI` 형식 복사
5. `[YOUR-PASSWORD]` 부분을 실제 데이터베이스 비밀번호로 교체
6. `.env` 파일의 `DATABASE_URL`에 입력
7. **중요**: 맥과 Windows 모두에서 동일한 `DATABASE_URL` 사용 (개인 서버 환경)

**네이버 API (선택사항):**
1. [네이버 개발자 센터](https://developers.naver.com/)에 로그인
2. 내 애플리케이션 메뉴로 이동
3. 애플리케이션 등록 또는 기존 애플리케이션 선택
4. **Client ID**와 **Client Secret** 확인

### Prisma 설정 (Prisma 7)

이 프로젝트는 Prisma 7을 사용합니다. Prisma Client를 생성하려면:

```bash
# Prisma Client 생성
pnpm prisma:generate

# 데이터베이스 마이그레이션 (개발)
pnpm prisma:migrate:dev

# Prisma Studio 실행 (데이터베이스 GUI)
pnpm prisma:studio
```

**중요 사항:**
- Prisma 7은 `prisma/config.ts` 파일에서 데이터베이스 연결을 설정합니다
- `schema.prisma`에는 `datasource`의 `url` 속성이 없습니다 (Prisma 7 요구사항)
- 맥과 Windows 모두에서 동일한 Prisma 7.2.0 버전 사용

### 개발 서버 실행

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
