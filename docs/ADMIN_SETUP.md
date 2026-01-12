# 관리자 설정 가이드 (Admin Setup Guide)

이 문서는 REHAB 앱의 관리자 권한 설정 방법을 설명합니다.

---

## 🔐 관리자 권한 체계

| 구성요소 | 역할 |
|----------|------|
| **Clerk publicMetadata** | 관리자 권한 SSOT (Single Source of Truth) |
| **Supabase RLS** | DB 2중 방어 |
| **Next.js API** | 관리자 CRUD 서버 경유 처리 |

---

## 1. Clerk에서 관리자 권한 부여

### 1.1 Clerk Dashboard 접속

1. [Clerk Dashboard](https://dashboard.clerk.com) 로그인
2. 해당 프로젝트 선택
3. 좌측 메뉴 → **Users** 클릭

### 1.2 사용자에게 admin role 부여

1. 관리자로 지정할 사용자 클릭
2. **Metadata** 섹션으로 스크롤
3. **Public metadata** 편집 클릭
4. 아래 JSON 입력 후 저장:

```json
{
  "role": "admin"
}
```

> [!WARNING]
> **Production 환경 주의사항**
> - Production 인스턴스에서 설정해야 실제 서비스에 반영됩니다.
> - Development 인스턴스의 설정은 로컬 개발에만 적용됩니다.

---

## 2. Session Token에 publicMetadata 포함

Clerk에서 세션 토큰에 `publicMetadata`를 포함시켜야 서버에서 role을 읽을 수 있습니다.

### 2.1 설정 방법

1. Clerk Dashboard → **Sessions** → **Customize session token**
2. 아래 템플릿 추가:

```json
{
  "publicMetadata": "{{user.public_metadata}}"
}
```

3. **Save** 클릭

### 2.2 확인 방법

서버에서 아래 코드로 role 확인:

```typescript
import { auth } from '@clerk/nextjs/server';

const { sessionClaims } = await auth();
console.log('Role:', sessionClaims?.publicMetadata?.role);
```

---

## 3. 관리자 접근 경로

| 경로 | 설명 |
|------|------|
| `/admin` | 관리자 대시보드 |
| `/admin/templates` | 운동 템플릿 관리 |
| `/admin/reviews` | 리뷰 관리 |
| `/admin/gyms` | 헬스장 정보 관리 |

---

## 4. 권한 확인 로직

### 4.1 Middleware 가드 (자동 적용)

`/admin/*` 경로는 자동으로 관리자 권한을 확인합니다.
비관리자는 `/unauthorized` 페이지로 리다이렉트됩니다.

### 4.2 API 가드

관리자 전용 API는 `requireAdmin()` 함수로 보호됩니다:

```typescript
import { requireAdmin } from '@/lib/auth/admin-guard';

export async function GET() {
  await requireAdmin(); // 비관리자면 에러 발생
  // 관리자 전용 로직...
}
```

---

## 5. 문제 해결

### Q: 관리자 설정 후에도 접근이 안 됩니다

1. **올바른 인스턴스 확인**: Production vs Development
2. **로그아웃 후 재로그인**: 세션 토큰 갱신 필요
3. **publicMetadata 확인**: Clerk Dashboard에서 설정값 재확인

### Q: sessionClaims에서 role이 undefined입니다

1. Session Token 커스터마이즈 설정 확인 (2.1 참조)
2. 설정 후 로그아웃/재로그인 필요

---

## 6. 보안 원칙

> [!IMPORTANT]
> - `publicMetadata`는 클라이언트에서 **읽기만** 가능하고 수정 불가
> - 관리자 CRUD는 반드시 **서버 API 경유**로 처리
> - Supabase 직접 접근은 RLS로 보호

---

## 참고 문서

- [Clerk RBAC with publicMetadata](https://clerk.com/docs/guides/basic-rbac)
- [Clerk Session Token Customization](https://clerk.com/docs/backend-requests/making/jwt-templates)
