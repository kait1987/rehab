# DATABASE_URL 변경 후 재시작 가이드

## 완료된 작업

✅ `.env` 파일의 `DATABASE_URL`이 다음 형식으로 설정되었습니다:
```
DATABASE_URL="postgresql://postgres.ggmoudegjlobgytngkgx:flslwl01%21%40%23@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
```

✅ Prisma Client가 재생성되었습니다.

## 다음 단계: 개발 서버 재시작

### 1. 개발 서버 완전 종료

**현재 실행 중인 개발 서버를 완전히 종료하세요:**

```powershell
# 방법 1: 터미널에서 Ctrl + C로 중지

# 방법 2: 포트를 사용하는 프로세스 강제 종료
$port = 3000
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($process) {
    Stop-Process -Id $process -Force
    Write-Host "포트 $port를 사용하는 프로세스 종료됨"
}
```

### 2. 개발 서버 재시작

```bash
pnpm dev
```

## 확인 사항

서버 시작 시 콘솔에 다음 메시지가 표시되어야 합니다:

```
[Prisma Client 초기화] 환경 변수 로드 상태:
  DATABASE_URL 존재: ✅ 있음
  DATABASE_URL 값: postgresql://postgres.ggmoudegjlobgytngkgx:***@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
  포트 6543 (풀러): ✅
  pgbouncer 파라미터: ✅

[DATABASE_URL 검증 성공]
  호스트: aws-0-ap-northeast-1.pooler.supabase.com
  포트: 6543
  데이터베이스: postgres
  사용자명: postgres.ggmoudegjlobgytngkgx
  비밀번호: ***
```

## 문제 해결

### 여전히 "Tenant or user not found" 에러가 발생하는 경우

1. **Supabase 대시보드에서 연결 문자열 확인**
   - [Supabase 대시보드](https://supabase.com/dashboard) → 프로젝트 선택
   - Settings → Database → Connection string
   - **Session mode** 또는 **Transaction mode** 선택
   - URI 형식 복사하여 `.env` 파일에 그대로 사용

2. **사용자명 형식 확인**
   - 연결 풀러에서는 `postgres`만 사용해야 할 수도 있습니다
   - 대시보드에서 제공하는 형식을 그대로 사용하세요

3. **연결 풀러 설정 확인**
   - Supabase 대시보드에서 연결 풀러가 활성화되어 있는지 확인

### 추가 도움말

- `docs/FIX_TENANT_USER_NOT_FOUND.md` - "Tenant or user not found" 에러 해결 가이드
- `docs/DATABASE_URL_TROUBLESHOOTING.md` - DATABASE_URL 트러블슈팅 가이드
- `docs/RESTART_SERVER_GUIDE.md` - 개발 서버 재시작 상세 가이드

