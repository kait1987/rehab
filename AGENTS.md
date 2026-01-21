# AGENTS.md

This file provides guidance to agentic coding agents (such as yourself) that operate in this repository.

## Development Commands

### Core Commands
```bash
pnpm dev          # Development server with turbopack
pnpm build        # Production build (includes Prisma generation)
pnpm start        # Start production server
pnpm lint         # Linting
```

### Testing Commands
```bash
# Unit tests (Vitest)
pnpm test         # Run all tests once
pnpm test:watch   # Watch mode
pnpm test:ui      # Vitest UI
pnpm test:coverage # With coverage
pnpm test:unit    # Unit tests only
pnpm test:api     # API tests only

# E2E tests (Playwright)
pnpm test:e2e     # Run all E2E tests
pnpm test:e2e:ui  # Playwright UI
pnpm test:e2e:debug # Debug mode
pnpm test:e2e:headed # Headed mode

# Single test execution
pnpm test path/to/test.test.ts    # Single unit test
pnpm test:e2e path/to/test.spec.ts # Single E2E test
```

### Database Commands
```bash
pnpm prisma:generate   # Generate client
pnpm prisma:migrate:dev # Run migrations in dev
pnpm prisma:studio     # Open Prisma Studio
pnpm gen:types         # Supabase types generation
```

### Verification Commands
```bash
pnpm verify            # Run all verification steps
pnpm verify:precheck   # Environment precheck
pnpm verify:seed       # Seed master data
pnpm verify:unit       # Run unit tests
pnpm verify:e2e        # Run E2E tests
pnpm verify:build      # Test production build
```

## Tech Stack & Architecture

### Core Technologies
- **Next.js 15.5.6** with React 19 and App Router
- **TypeScript** with strict mode enabled
- **Package Manager**: pnpm (required)
- **Node**: >=22.0.0 <25.0.0

### Authentication & Database
- **Clerk** for authentication with Korean localization
- **Supabase** (PostgreSQL) for data storage
- **Prisma** as ORM (migrated from Supabase client)

### Frontend
- **Tailwind CSS v4** (no config file, uses `globals.css`)
- **shadcn/ui** components based on Radix UI
- **lucide-react** for icons
- **react-hook-form + Zod** for form validation

### Testing
- **Vitest** for unit/integration tests
- **Playwright** for E2E tests
- **@testing-library** for component testing

## Project Architecture

### Clerk + Supabase Integration
이 프로젝트는 Clerk와 Supabase의 네이티브 통합을 사용합니다:
- Clerk가 사용자 인증 처리
- `SyncUserProvider`가 로그인 시 자동으로 Clerk 사용자를 Supabase `users` 테이블에 동기화
- Supabase 클라이언트가 Clerk 토큰을 사용하여 인증

### Supabase Clients (`lib/supabase/`)
- `clerk-client.ts`: Client Component용 (useClerkSupabaseClient hook)
- `server.ts`: Server Component/Server Action용 (createClerkSupabaseClient)
- `service-role.ts`: 관리자 권한 작업용 (SUPABASE_SERVICE_ROLE_KEY 사용)
- `client.ts`: 인증 불필요한 공개 데이터용

### Directory Convention
```
src/
├── app/           # Routing only (page.tsx, layout.tsx, route.ts)
├── components/    # Reusable components
│   └── ui/        # shadcn components (auto-generated, don't edit)
├── lib/           # Utilities, clients, configurations
├── hooks/         # Custom React hooks
├── actions/       # Server Actions (preferred over API routes)
├── types/         # TypeScript type definitions
└── middleware.ts  # Next.js middleware
```

### Naming Conventions
- **Files**: `kebab-case` (e.g., `use-sync-user.ts`, `sync-user-provider.tsx`)
- **Components**: `PascalCase` (but filenames remain `kebab-case`)
- **Functions/Variables**: `camelCase`
- **Types/Interfaces**: `PascalCase`

## Database

### Supabase Migrations
마이그레이션 파일 명명 규칙: `YYYYMMDDHHmmss_description.sql`
- 새 테이블 생성 시 반드시 Row Level Security (RLS) 활성화
- 개발 중에는 RLS를 비활성화할 수 있으나, 프로덕션에서는 활성화 필수
- RLS 정책은 세분화: select, insert, update, delete별로 각각 작성

### Current Schema
- `users`: Clerk 사용자와 동기화되는 사용자 정보 (id, clerk_id, name, created_at)
- `study` Storage 버킷: 사용자 파일 저장소 ({clerk_user_id}/{filename})

## Environment Variables
```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STORAGE_BUCKET=study

# Database
DATABASE_URL=              # Prisma
```

## Code Style Guidelines

### Import Organization
```typescript
// 1. React/Next.js imports
import { useState } from 'react';
import { headers } from 'next/headers';

// 2. Third-party libraries
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// 3. Internal imports (use @ alias)
import { supabase } from '@/lib/supabase/client';
import { User } from '@/types/database';
import { cn } from '@/lib/utils';
```

### TypeScript Guidelines
- **Strict typing required** for all code
- **Prefer interfaces** over types for object shapes
- **Use `satisfies` operator** for type validation
- **Avoid enums** - use const objects instead
- **Always return types** for functions

### Component Patterns
```typescript
// Server Components (default)
export default function ServerComponent() {
  return <div>Content</div>;
}

// Client Components (only when needed)
'use client';
export default function ClientComponent() {
  const [state, setState] = useState();
  return <div>Interactive content</div>;
}
```

### Error Handling
```typescript
async function getUser(id: string) {
  try {
    const user = await supabase.from('users').select('*').eq('id', id).single();
    if (user.error) throw user.error;
    return { success: true, data: user.data };
  } catch (error) {
    console.error('Failed to get user:', error);
    return { success: false, error: error.message };
  }
}
```

## Development Guidelines

### Server Actions vs API Routes
- **Prefer Server Actions** in `actions/` directory
- **API Routes** only for webhooks, external integrations
- **Always use async** for Next.js runtime APIs

### UI Components
- **shadcn/ui** for all UI elements
- **lucide-react** for all icons
- **Check `/components/ui/`** before installing new components
- **Install with**: `pnpx shadcn@latest add [component-name]`

### Styling
- **Tailwind CSS v4** only (no CSS-in-JS)
- **No config file** - uses `globals.css`
- **Dark/light mode** support required

### React 19 & Next.js 15 Patterns
```typescript
// Use async for all runtime APIs
const cookieStore = await cookies();
const headersList = await headers();
const params = await props.params;

// Server Components by default
export default async function ServerPage({ params }) {
  const data = await getData(params.id);
  return <div>{data.name}</div>;
}
```

## Testing Guidelines

### Unit Tests (Vitest)
- **File pattern**: `*.test.ts` or `*.spec.ts`
- **Location**: Next to source file in `__tests__/` directory
- **Coverage thresholds**: 70% lines, 70% functions, 60% branches
- **Use describe/it/expect** pattern

### E2E Tests (Playwright)
- **File pattern**: `*.spec.ts`
- **Location**: `tests/e2e/` directory
- **Organize by**: `flows/`, `unauthenticated/`, `exceptions/`
- **Use Page Object Model** for complex interactions

### Test Examples
```typescript
// Unit test
import { describe, it, expect } from 'vitest';
import { distributeTime } from '../distribute-time';

describe('distributeTime', () => {
  it('should distribute time correctly', () => {
    const result = distributeTime(exercises, 90);
    expect(result).toHaveLength(expected);
  });
});

// E2E test
import { test, expect } from '@playwright/test';

test.describe('User Flow', () => {
  test('should complete onboarding', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /시작하기/i }).click();
  });
});
```

## Security Best Practices

### Authentication
- **Clerk handles** all auth logic
- **SyncUserProvider** manages user data
- **Middleware** protects routes
- **Never expose** secrets in client code

### Data Validation
- **Zod schemas** for all inputs
- **Server-side validation** required
- **Sanitize user inputs**
- **Use parameterized queries**

## Key Files to Understand

- `middleware.ts` - Clerk authentication middleware
- `src/lib/supabase/` - Database clients
- `src/hooks/use-sync-user.ts` - User synchronization
- `vitest.config.ts` - Test configuration
- `playwright.config.ts` - E2E test setup

## Additional Cursor Rules

프로젝트에는 다음 Cursor 규칙들이 있습니다:
- `.cursor/rules/web/nextjs-convention.mdc`: Next.js 컨벤션
- `.cursor/rules/web/design-rules.mdc`: UI/UX 디자인 가이드
- `.cursor/rules/web/playwright-test-guide.mdc`: 테스트 가이드
- `.cursor/rules/supabase/`: Supabase 관련 규칙들

주요 원칙은 이 AGENTS.md에 통합되어 있으나, 세부사항은 해당 파일들 참고.