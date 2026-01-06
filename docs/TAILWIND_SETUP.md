# Tailwind CSS v4 설정 문서

> REHAB 재활운동 어플리케이션 - Tailwind CSS v4 설정 및 사용 가이드

## Tailwind CSS v4 개요

- **버전**: Tailwind CSS v4 (^4.x)
- **설정 방식**: CSS 파일 기반 설정 (`globals.css`)
- **PostCSS 플러그인**: `@tailwindcss/postcss` (^4.x)

## 설치 및 설정

### package.json 의존성

```json
{
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4"
  }
}
```

### globals.css 설정

Tailwind CSS v4는 `globals.css` 파일에서 직접 설정합니다:

```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* CSS 변수와 Tailwind 클래스 매핑 */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* ... */
}
```

**주요 특징**:
- `@import "tailwindcss"`: Tailwind CSS v4 기본 스타일 임포트
- `@custom-variant dark`: 다크 모드 커스텀 변형 정의
- `@theme inline`: 인라인 테마 설정 블록

## 색상 시스템

### 다크 모드 기반 컬러 팔레트 (참고 이미지 6개 화면 기반)

다크 퍼플/블랙 배경 + 화이트 텍스트 + 퍼플 액센트:

#### 배경 색상 (다크 퍼플/블랙 계열)
```css
--background: oklch(0.10 0 0);         /* #1A1A1A - 어두운 회색/검정 계열 */
--foreground: oklch(0.95 0 0);         /* #F2F2F2 - 밝은 회색/흰색 */
--card: oklch(0.15 0 0);               /* #262626 - 약간 밝은 어두운 회색 */
--muted: oklch(0.12 0 0);              /* #1F1F1F - 어두운 배경 */
--border: oklch(0.25 0 0);             /* #404040 - 보더 색상 */
--input: oklch(0.12 0 0);              /* #1F1F1F - 어두운 입력 필드 */
```

#### Primary (퍼플) - 참고 이미지의 퍼플 버튼
```css
--primary: oklch(0.55 0.15 300);       /* #8B5CF6 - 퍼플 액센트 */
--primary-hover: oklch(0.60 0.15 300); /* 더 밝은 퍼플 - 호버 상태 */
--primary-light: oklch(0.25 0.08 300); /* 다크 모드용 연한 퍼플 배경 */
--primary-dark: oklch(0.50 0.16 300);   /* 진한 퍼플 - 강조 텍스트 */
```

#### Secondary (세이지 그린) - 재활 앱 특성 유지
```css
--secondary: oklch(0.65 0.10 150);     /* #87A98A - 세이지 그린 */
--secondary-hover: oklch(0.60 0.10 150);
--secondary-light: oklch(0.20 0.05 150);
--secondary-dark: oklch(0.50 0.12 150);
```

### Tailwind 클래스 사용

색상은 CSS 변수를 통해 Tailwind 클래스로 사용됩니다:

```tsx
// Primary 색상
<div className="bg-primary text-primary-foreground">
  테라코타 배경
</div>

// Secondary 색상
<div className="bg-secondary text-secondary-foreground">
  샌드 베이지 배경
</div>

// Background & Foreground
<div className="bg-background text-foreground">
  크림 베이지 배경, 차콜 텍스트
</div>
```

## 다크 모드

**다크 모드가 기본 테마입니다.**

- `:root`에 다크 모드 색상이 직접 정의됨
- 라이트 모드 토글 기능 제거
- `ThemeProvider` 및 `ThemeToggle` 제거됨
- 모든 페이지가 다크 모드로 표시됨

## 반응형 디자인

### 모바일 우선 전략

Tailwind CSS는 기본적으로 **모바일 우선** 전략을 사용합니다:

```tsx
// 모바일: 기본 스타일
<div className="text-sm">작은 텍스트</div>

// 태블릿 이상: md: 브레이크포인트
<div className="text-sm md:text-base">반응형 텍스트</div>

// 데스크톱: lg: 브레이크포인트
<div className="text-sm md:text-base lg:text-lg">더 큰 텍스트</div>
```

### 브레이크포인트

기본 브레이크포인트:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### 사용 예시

```tsx
// 모바일 우선 레이아웃
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 모바일: 1열, 태블릿: 2열, 데스크톱: 3열 */}
</div>

// 반응형 패딩
<div className="px-4 sm:px-6 md:px-8 lg:px-12">
  {/* 화면 크기에 따라 패딩 증가 */}
</div>
```

## 커스텀 유틸리티

### Radial Gradient

```css
@layer utilities {
  .bg-gradient-radial {
    background-image: radial-gradient(circle, var(--tw-gradient-stops));
  }
}
```

**사용 예시**:
```tsx
<div className="bg-gradient-radial from-primary/20 to-transparent">
  방사형 그라데이션
</div>
```

## 폰트 시스템

### Google Fonts

Next.js의 `next/font/google`을 사용하여 폰트를 로드합니다:

```typescript
// src/app/layout.tsx
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
```

### CSS 변수 매핑

```css
@theme inline {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

### 사용 예시

```tsx
<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
  {/* 폰트 변수가 body에 적용됨 */}
</body>
```

## Border Radius

둥근 모서리 시스템:

```css
:root {
  --radius: 1rem; /* 기본 반경 */
}

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```

**사용 예시**:
```tsx
<div className="rounded-lg">기본 둥근 모서리</div>
<div className="rounded-xl">더 둥근 모서리</div>
```

## PostCSS 설정

Tailwind CSS v4는 PostCSS 플러그인을 통해 처리됩니다:

```json
// package.json (추정)
{
  "postcss": {
    "plugins": {
      "@tailwindcss/postcss": {}
    }
  }
}
```

또는 `postcss.config.js`:

```javascript
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

## 주요 Tailwind 클래스

### 색상
- `bg-primary`, `text-primary-foreground`
- `bg-secondary`, `text-secondary-foreground`
- `bg-background`, `text-foreground`
- `bg-muted`, `text-muted-foreground`
- `bg-accent`, `text-accent-foreground`

### 간격
- `p-4`, `px-6`, `py-8` (패딩)
- `m-4`, `mx-6`, `my-8` (마진)
- `gap-4`, `space-y-4` (간격)

### 레이아웃
- `flex`, `grid`
- `container`, `mx-auto`
- `max-w-7xl`, `w-full`

### 반응형
- `sm:`, `md:`, `lg:`, `xl:`, `2xl:` 프리픽스

## 통증 신호등 시스템

통증 정도에 따른 색상 시스템:

```css
--pain-safe: oklch(0.65 0.15 150);      /* 안전 (초록) */
--pain-caution: oklch(0.75 0.15 70);    /* 주의 (노랑) */
--pain-danger: oklch(0.6 0.2 25);       /* 위험 (빨강) */
```

**사용 예시**:
```tsx
<div className="bg-pain-safe text-pain-safe-foreground">
  안전한 운동
</div>
```

## 참고 문서

- [Tailwind CSS v4 공식 문서](https://tailwindcss.com/docs)
- [Next.js + Tailwind CSS 가이드](https://nextjs.org/docs/app/building-your-application/styling/tailwind-css)
- [PRD.md](./PRD.md): 제품 요구사항 문서
- [NEXTJS_SETUP.md](./NEXTJS_SETUP.md): Next.js 프로젝트 구조 문서

## 주의사항

1. **CSS 변수 기반**: Tailwind CSS v4는 CSS 변수를 통해 색상을 관리합니다.
2. **모바일 우선**: 기본 스타일은 모바일용이며, 큰 화면용 스타일은 프리픽스로 추가합니다.
3. **다크 모드 기본**: 다크 모드가 기본 테마이며, 라이트 모드 토글 기능이 없습니다.
4. **커스텀 유틸리티**: `@layer utilities`를 통해 커스텀 유틸리티 클래스를 추가할 수 있습니다.

