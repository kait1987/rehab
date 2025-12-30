# 배포 가이드

이 문서는 프로젝트를 Vercel에 배포하는 방법을 안내합니다.

## 📋 사전 준비사항

### 1. GitHub 저장소 준비
- [ ] 코드를 GitHub 저장소에 푸시
- [ ] 저장소가 Private인 경우 Vercel과 연동 설정

### 2. 서비스 계정 준비
- [ ] Clerk 계정 및 프로젝트 생성
- [ ] Supabase 계정 및 프로젝트 생성

## 🚀 Vercel 배포 단계

### 1. Vercel 프로젝트 생성

1. [Vercel 대시보드](https://vercel.com/dashboard)에 로그인
2. **Add New** → **Project** 클릭
3. GitHub 저장소 선택 또는 Import
4. 프로젝트 설정:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `pnpm build` (자동 감지됨)
   - **Output Directory**: `.next` (자동 감지됨)
   - **Install Command**: `pnpm install` (자동 감지됨)

### 2. 환경 변수 설정

Vercel 프로젝트 설정 → **Environment Variables**에서 다음 변수들을 추가하세요:

#### Clerk 인증 설정

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

#### Supabase 데이터베이스 설정

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STORAGE_BUCKET=study
```

**중요**: 
- 환경 변수는 **Production**, **Preview**, **Development** 환경별로 설정할 수 있습니다.
- 프로덕션 환경에서는 실제 키를 사용해야 합니다 (테스트 키 사용 금지).

### 3. 배포 실행

1. Vercel 대시보드에서 **Deploy** 버튼 클릭
2. 빌드 로그 확인
3. 배포 완료 후 제공되는 URL로 접속 테스트

## ✅ 배포 후 확인사항

### 필수 확인 항목

- [ ] 홈페이지 접속 확인
- [ ] 회원가입/로그인 기능 확인

### 데이터베이스 확인

- [ ] Supabase에서 테이블 생성 확인

### 에러 확인

- [ ] Vercel 로그에서 에러 확인
- [ ] Supabase 로그에서 에러 확인
- [ ] 브라우저 콘솔에서 에러 확인

## 🔧 문제 해결

### 빌드 실패

**문제**: Vercel 빌드가 실패하는 경우

**해결 방법**:
1. 로컬에서 `pnpm build` 실행하여 빌드 에러 확인
2. 환경 변수 설정 확인
3. TypeScript 타입 에러 확인
4. 의존성 설치 문제 확인

### 환경 변수 오류

**문제**: 환경 변수가 제대로 로드되지 않는 경우

**해결 방법**:
1. Vercel 대시보드에서 환경 변수 이름 확인 (대소문자 구분)
2. `NEXT_PUBLIC_` 접두사 확인 (클라이언트 사이드 변수)
3. 배포 후 재빌드 확인

### 데이터베이스 연결 오류

**문제**: Supabase 연결이 실패하는 경우

**해결 방법**:
1. Supabase 프로젝트 URL 확인
2. Supabase API 키 확인
3. Supabase 프로젝트가 활성화되어 있는지 확인
4. 네트워크 방화벽 설정 확인

### 인증 오류

**문제**: Clerk 인증이 작동하지 않는 경우

**해결 방법**:
1. Clerk Publishable Key와 Secret Key 확인
2. Clerk 대시보드에서 프로젝트 상태 확인
3. 리다이렉트 URL 설정 확인
4. 미들웨어 설정 확인

## 🔒 보안 주의사항

1. **절대 노출 금지**:
   - `CLERK_SECRET_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - 이 키들은 서버 사이드에서만 사용되어야 합니다.

2. **환경 변수 관리**:
   - 프로덕션과 개발 환경의 키를 분리
   - 정기적으로 키 로테이션
   - 키 유출 시 즉시 재발급

## 📚 참고 자료

- [Vercel 배포 가이드](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Clerk 배포 가이드](https://clerk.com/docs/deployments/overview)
- [Supabase 배포 가이드](https://supabase.com/docs/guides/hosting)
