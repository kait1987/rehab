# 개발 서버 재시작 가이드

## DATABASE_URL 변경 후 필수 단계

`.env` 파일의 `DATABASE_URL`을 변경한 후에는 **반드시** 다음 단계를 따라야 합니다.

## 1단계: 개발 서버 완전 종료

### Windows (PowerShell)

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

### 모든 터미널 창 확인

- 실행 중인 모든 터미널 창을 확인하세요
- `pnpm dev` 또는 `npm run dev`가 실행 중인 터미널을 모두 닫으세요

## 2단계: 캐시 삭제 (선택사항이지만 권장)

```bash
# Next.js 빌드 캐시 삭제
Remove-Item -Recurse -Force .next

# 또는
rm -rf .next
```

## 3단계: Prisma Client 재생성

```bash
# Prisma Client 재생성
pnpm prisma:generate
```

**중요:** Prisma Client는 빌드 타임에 생성되므로, 환경 변수 변경 후 반드시 재생성해야 합니다.

## 4단계: 환경 변수 확인 (선택사항)

```bash
# DATABASE_URL 환경 변수 확인
pnpm verify:database-url
```

이 명령어는 실제로 로드된 `DATABASE_URL` 값을 확인하고, 연결 정보를 검증합니다.

## 5단계: 개발 서버 재시작

```bash
# 개발 서버 시작
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
  ...
```

## 문제 해결

### 여전히 이전 설정을 사용하는 경우

1. **모든 Node.js 프로세스 종료 확인**
   ```powershell
   Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
   ```

2. **Prisma Client 완전 삭제 후 재생성**
   ```bash
   Remove-Item -Recurse -Force node_modules/.prisma
   pnpm prisma:generate
   ```

3. **환경 변수 확인**
   ```bash
   pnpm verify:database-url
   ```

### "Can't reach database server" 에러

- 연결 풀러(포트 6543)를 사용하는지 확인
- `pgbouncer=true` 파라미터가 포함되어 있는지 확인
- Supabase 대시보드에서 연결 풀러가 활성화되어 있는지 확인

## 빠른 참조

```bash
# 전체 재시작 프로세스 (한 번에 실행)
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules/.prisma -ErrorAction SilentlyContinue
pnpm prisma:generate
pnpm verify:database-url
pnpm dev
```

## 참고 문서

- [DATABASE_URL 트러블슈팅 가이드](./DATABASE_URL_TROUBLESHOOTING.md)
- [README.md - Prisma DATABASE_URL 섹션](../README.md#prisma-database_url)

