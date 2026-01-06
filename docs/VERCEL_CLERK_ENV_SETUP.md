# Vercel Clerk 환경 변수 설정 가이드

이 문서는 Vercel에 배포된 Next.js 애플리케이션에서 Clerk 인증을 위한 환경 변수를 설정하는 방법을 안내합니다.

## 📋 사전 준비사항

- [ ] Clerk 계정 및 프로젝트 생성 완료
- [ ] Vercel 계정 및 프로젝트 생성 완료
- [ ] GitHub 저장소와 Vercel 프로젝트 연동 완료

## 🔑 필수 환경 변수

Clerk middleware가 정상 작동하려면 다음 환경 변수가 반드시 설정되어야 합니다:

### 1. NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

**설명**: Clerk Publishable Key (클라이언트 사이드에서 사용)

**형식**:
- 테스트 환경: `pk_test_[YOUR_PUBLISHABLE_KEY]`
- 프로덕션 환경: `pk_live_[YOUR_PUBLISHABLE_KEY]`

**특징**:
- `NEXT_PUBLIC_` 접두사가 붙어 있어 클라이언트 사이드에서 접근 가능
- 공개되어도 안전한 키 (하지만 보안을 위해 공개 저장소에 커밋하지 않는 것을 권장)

### 2. CLERK_SECRET_KEY

**설명**: Clerk Secret Key (서버 사이드 전용)

**형식**:
- 테스트 환경: `sk_test_[YOUR_SECRET_KEY]`
- 프로덕션 환경: `sk_live_[YOUR_SECRET_KEY]`

**특징**:
- 서버 사이드에서만 사용되는 비밀 키
- **절대 클라이언트에 노출되면 안 됨**
- **절대 공개 저장소에 커밋하지 마세요**

## 📝 선택적 환경 변수

다음 환경 변수는 기본값을 사용할 수 있지만, 커스터마이징이 필요한 경우 설정할 수 있습니다:

- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/`

## 🔍 Clerk 키 확인 방법

### Step 1: Clerk 대시보드 접속

1. [Clerk 대시보드](https://dashboard.clerk.com/)에 로그인
2. 프로젝트 선택

### Step 2: API Keys 페이지 이동

1. 좌측 메뉴에서 **API Keys** 클릭
2. 또는 **Configure** → **API Keys** 메뉴로 이동

### Step 3: 키 복사

1. **Publishable Key** 섹션에서 키 복사
   - 이 키를 `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`에 설정
2. **Secret Key** 섹션에서 **Reveal** 버튼 클릭 후 키 복사
   - 이 키를 `CLERK_SECRET_KEY`에 설정

**주의사항**:
- Secret Key는 한 번만 표시되므로 복사 시 주의하세요
- 키를 잃어버린 경우 Clerk 대시보드에서 재생성할 수 있습니다

## 🚀 Vercel 환경 변수 설정 방법

### Step 1: Vercel 대시보드 접속

1. [Vercel 대시보드](https://vercel.com/dashboard)에 로그인
2. 프로젝트 선택

### Step 2: 환경 변수 설정 페이지 이동

1. 프로젝트 대시보드에서 **Settings** 탭 클릭
2. 좌측 메뉴에서 **Environment Variables** 클릭

### Step 3: 환경 변수 추가

#### NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY 추가

1. **Add New** 버튼 클릭
2. 다음 정보 입력:
   - **Key**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Value**: Clerk 대시보드에서 복사한 Publishable Key
   - **Environment**: 
     - ✅ Production
     - ✅ Preview
     - ✅ Development
     - (모든 환경에 적용)
3. **Save** 버튼 클릭

#### CLERK_SECRET_KEY 추가

1. **Add New** 버튼 클릭
2. 다음 정보 입력:
   - **Key**: `CLERK_SECRET_KEY`
   - **Value**: Clerk 대시보드에서 복사한 Secret Key
   - **Environment**: 
     - ✅ Production
     - ✅ Preview
     - ✅ Development
     - (모든 환경에 적용)
3. **Save** 버튼 클릭

### Step 4: 환경 변수 확인

1. 추가된 환경 변수 목록 확인
2. 각 환경 변수의 값이 올바르게 설정되었는지 확인
3. 키 이름의 대소문자와 언더스코어(`_`)가 정확한지 확인

### Step 5: 재배포

**자동 재배포**:
- Vercel은 환경 변수 변경 시 자동으로 재배포를 트리거합니다
- 배포 상태는 프로젝트 대시보드에서 확인할 수 있습니다

**수동 재배포** (필요한 경우):
1. 프로젝트 대시보드에서 **Deployments** 탭 클릭
2. 최신 배포의 **⋯** 메뉴 클릭
3. **Redeploy** 선택

## ✅ 설정 확인 방법

### 1. Vercel 로그 확인

1. Vercel 대시보드 → 프로젝트 → **Logs** 탭
2. 배포 로그에서 환경 변수 관련 에러가 없는지 확인
3. `MIDDLEWARE_INVOCATION_FAILED` 에러가 사라졌는지 확인

### 2. 애플리케이션 테스트

다음 기능들이 정상 작동하는지 확인:

- [ ] 홈페이지 접속 (`/`)
- [ ] 로그인 페이지 접속 (`/sign-in`)
- [ ] 회원가입 페이지 접속 (`/sign-up`)
- [ ] 보호된 페이지 접근 시도 (`/my` - 로그인 필요)
- [ ] 공개 페이지 접근 (`/gyms`, `/courses`)

### 3. 브라우저 콘솔 확인

1. 브라우저 개발자 도구 열기 (F12)
2. **Console** 탭에서 Clerk 관련 에러 확인
3. **Network** 탭에서 API 요청 실패 확인

## 🔧 문제 해결

### 문제 1: "MIDDLEWARE_INVOCATION_FAILED" 에러

**원인**: 환경 변수가 설정되지 않았거나 잘못 설정됨

**해결 방법**:
1. Vercel 대시보드에서 환경 변수 설정 확인
2. 키 이름이 정확한지 확인 (대소문자, 언더스코어)
3. 키 값이 올바른지 확인 (Clerk 대시보드에서 재확인)
4. 재배포 실행

### 문제 2: "Clerk: Missing publishableKey" 에러

**원인**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`가 설정되지 않음

**해결 방법**:
1. Vercel 환경 변수에 `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` 추가
2. 값이 올바른지 확인
3. 재배포 실행

### 문제 3: 인증이 작동하지 않음

**원인**: `CLERK_SECRET_KEY`가 설정되지 않았거나 잘못 설정됨

**해결 방법**:
1. Vercel 환경 변수에 `CLERK_SECRET_KEY` 추가
2. Secret Key가 올바른지 확인 (테스트/프로덕션 키 구분)
3. 재배포 실행

### 문제 4: 환경 변수가 로드되지 않음

**원인**: 환경 변수 변경 후 재배포가 되지 않음

**해결 방법**:
1. Vercel 대시보드에서 수동 재배포 실행
2. 또는 코드를 약간 수정하여 커밋/푸시 (자동 재배포 트리거)

## 🔒 보안 주의사항

1. **Secret Key 보호**:
   - `CLERK_SECRET_KEY`는 절대 클라이언트 사이드에서 사용하지 마세요
   - 공개 저장소(GitHub 등)에 커밋하지 마세요
   - `.env` 파일은 `.gitignore`에 포함되어 있는지 확인

2. **환경별 키 분리**:
   - 테스트 환경: `pk_test_...`, `sk_test_...` 사용
   - 프로덕션 환경: `pk_live_...`, `sk_live_...` 사용
   - 프로덕션에서는 반드시 Live Key 사용

3. **키 로테이션**:
   - 정기적으로 키를 재생성하는 것을 권장
   - 키 유출 시 즉시 재발급

## 📚 참고 자료

- [Clerk 공식 문서](https://clerk.com/docs)
- [Clerk Next.js 가이드](https://clerk.com/docs/quickstarts/nextjs)
- [Vercel 환경 변수 가이드](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js 환경 변수 가이드](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

## 📞 추가 도움

문제가 해결되지 않으면:

1. Vercel 로그에서 상세한 에러 메시지 확인
2. Clerk 대시보드에서 프로젝트 상태 확인
3. [Clerk 지원 센터](https://clerk.com/support)에 문의

