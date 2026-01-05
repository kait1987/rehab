# DATABASE_URL 환경 변수 로드 문제 해결 가이드

## 문제 증상

`.env` 파일의 `DATABASE_URL`이 올바르게 설정되어 있지만, 애플리케이션이 여전히 이전 설정(직접 연결, 포트 5432)을 사용하는 경우

## 원인

1. **개발 서버가 재시작되지 않음**: Next.js는 서버 시작 시에만 환경 변수를 로드합니다
2. **Prisma Client 캐시**: 이전 설정으로 생성된 Prisma Client가 캐시되어 있을 수 있습니다
3. **Next.js 빌드 캐시**: `.next` 디렉토리에 이전 설정이 캐시되어 있을 수 있습니다

## 해결 방법

### 1단계: 개발 서버 완전 종료

**Windows (PowerShell):**
```powershell
# 실행 중인 Next.js 프로세스 찾기
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Select-Object Id, ProcessName

# 특정 포트(3000)를 사용하는 프로세스 종료
$port = 3000
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($process) {
    Stop-Process -Id $process -Force
    Write-Host "포트 $port를 사용하는 프로세스 종료됨"
}
```

**또는 간단하게:**
- 터미널에서 `Ctrl + C`로 개발 서버 중지
- 모든 터미널 창을 닫고 새로 열기

### 2단계: Next.js 캐시 삭제 (선택사항)

```bash
# .next 디렉토리 삭제
Remove-Item -Recurse -Force .next

# 또는
rm -rf .next
```

### 3단계: Prisma Client 재생성

```bash
# Prisma Client 재생성
pnpm prisma:generate
```

### 4단계: 개발 서버 재시작

```bash
# 개발 서버 시작
pnpm dev
```

## 확인 방법

서버 시작 시 콘솔에 다음 메시지가 표시되어야 합니다:

```
[Prisma Client 초기화] 환경 변수 로드 상태:
  DATABASE_URL 존재: ✅ 있음
  DATABASE_URL 값: postgresql://postgres.ggmoudegjlobgytngkgx:***@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
  DATABASE_URL 길이: 150
  호스트 포함: ✅
  포트 6543 (풀러): ✅
  포트 5432 (직접): ✅
  pgbouncer 파라미터: ✅

[DATABASE_URL 검증 성공]
  호스트: aws-0-ap-northeast-1.pooler.supabase.com
  포트: 6543
  데이터베이스: postgres
  사용자명: postgres.ggmoudegjlobgytngkgx
  비밀번호: ***
```

## 문제가 계속되는 경우

### 1. .env 파일 위치 확인

`.env` 파일이 프로젝트 루트(`package.json`과 같은 디렉토리)에 있어야 합니다:

```
nextjs-supabase-boilerplate-main/
├── .env          ← 여기!
├── package.json
├── prisma/
└── ...
```

### 2. .env 파일 형식 확인

```env
# ✅ 올바른 형식 (따옴표 사용)
DATABASE_URL="postgresql://postgres.ggmoudegjlobgytngkgx:비밀번호@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"

# ✅ 올바른 형식 (따옴표 없음)
DATABASE_URL=postgresql://postgres.ggmoudegjlobgytngkgx:비밀번호@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true

# ❌ 잘못된 형식 (프로젝트 URL 사용)
DATABASE_URL=https://ggmoudegjlobgytngkgx.supabase.co

# ❌ 잘못된 형식 (직접 연결 - 연결 실패 가능)
DATABASE_URL=postgresql://postgres.ggmoudegjlobgytngkgx:비밀번호@db.ggmoudegjlobgytngkgx.supabase.co:5432/postgres?sslmode=require
```

### 3. 환경 변수 중복 확인

`.env.local`, `.env.development`, `.env.production` 파일이 있다면 확인하세요. 이 파일들의 우선순위가 더 높을 수 있습니다.

### 4. Supabase 연결 풀러 확인

Supabase 대시보드에서 연결 풀러가 활성화되어 있는지 확인:
1. [Supabase 대시보드](https://supabase.com/dashboard) → 프로젝트 선택
2. Settings → Database
3. Connection string → **Session mode** 또는 **Transaction mode** 선택
4. URI 형식 복사

## 추가 디버깅

문제가 계속되면 다음 정보를 확인하세요:

1. **서버 시작 시 콘솔 로그**: `[Prisma Client 초기화]` 섹션 확인
2. **검증 로그**: `[DATABASE_URL 검증 성공]` 또는 `[DATABASE_URL 검증 실패]` 메시지 확인
3. **에러 메시지**: 정확한 에러 메시지와 스택 트레이스 확인

## 참고 문서

- [README.md - Prisma DATABASE_URL 섹션](../README.md#prisma-database_url)
- [docs/TROUBLESHOOTING_DATABASE_URL.md](./TROUBLESHOOTING_DATABASE_URL.md)

