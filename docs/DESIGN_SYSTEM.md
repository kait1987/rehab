# REHAB 디자인 시스템

> 재활 운동 앱을 위한 통합 디자인 가이드라인  
> Planfit의 깔끔한 카드 UI 구조를 참고하되, '치유/회복' 무드로 완전히 재구성

## 📋 목차

1. [디자인 철학](#디자인-철학)
2. [색상 팔레트](#색상-팔레트)
3. [통증 신호등 시스템](#통증-신호등-시스템)
4. [타이포그래피](#타이포그래피)
5. [UI 컴포넌트 스타일](#ui-컴포넌트-스타일)
6. [간격 시스템](#간격-시스템)
7. [아이콘 & 이미지](#아이콘--이미지)
8. [애니메이션](#애니메이션)
9. [접근성](#접근성)

---

## 디자인 철학

### 핵심 원칙

**1. 치유와 회복 (Healing & Recovery)**
- Planfit은 '성능/근육' 중심이지만, REHAB은 '치유/회복' 중심
- 심리적 안정감을 주는 부드러운 색상과 형태
- 통증 관리와 안전이 최우선

**2. 안전 우선 (Safety First)**
- 운동 강도보다 통증 정도와 안전이 중요
- 명확한 통증 신호등 시스템으로 위험 방지
- 전문적이면서도 접근 가능한 정보 전달

**3. 부드러운 미니멀리즘 (Soft Minimalism)**
- Planfit의 깔끔한 카드 UI 구조 참고
- 날카로운 모서리 대신 둥근 형태 (Rounded)
- 넓은 여백과 부드러운 그림자

**4. 심리적 안정 (Psychological Comfort)**
- 강렬한 원색 대신 세이지 그린, 소프트 틸 등 차분한 색상
- 긴장을 완화하는 시각적 요소
- 회복을 상징하는 자연스러운 색감

### 참고 브랜드

- **Planfit** ([wwit.design/2023/07/24/planfit](https://wwit.design/2023/07/24/planfit/)): 깔끔한 카드 UI 구조, 명확한 정보 계층
- **차별점**: Planfit은 강렬한 원색과 날카로운 형태, REHAB은 부드러운 색상과 둥근 형태

---

## 색상 팔레트

### Primary Colors (주요 색상)

재활 운동 앱의 핵심 아이덴티티를 나타내는 색상입니다. 심리적 안정감을 주는 차분한 톤을 사용합니다.

#### Sage Green (세이지 그린) - 메인 브랜드 컬러
```css
--primary: oklch(0.65 0.10 150);        /* #87A98A - 심리적 안정, 자연스러운 회복 */
--primary-hover: oklch(0.60 0.10 150);  /* #7A9680 - 호버 상태 */
--primary-light: oklch(0.92 0.04 150);  /* #E8F0E9 - 배경/강조용 */
--primary-dark: oklch(0.50 0.12 150);   /* #5F7A65 - 강조 텍스트 */
```

**심리적 효과:**
- 차분함과 안정감 제공
- 자연스러운 회복을 상징
- 눈의 피로 감소

**사용 예시:**
- 주요 CTA 버튼
- 브랜드 로고
- 진행 상태 표시
- 안전한 운동 표시

#### Soft Teal (소프트 틸) - 보조 브랜드 컬러
```css
--secondary: oklch(0.60 0.12 200);       /* #6BA5B8 - 신뢰와 전문성 */
--secondary-hover: oklch(0.55 0.12 200); /* #5E94A6 */
--secondary-light: oklch(0.90 0.05 200); /* #E0EDF2 */
--secondary-dark: oklch(0.45 0.14 200); /* #4A7A8A */
```

**심리적 효과:**
- 신뢰감과 전문성 표현
- 차분한 정보 전달
- 집중력 향상

**사용 예시:**
- 정보성 버튼
- 헬스장 정보 카드
- 전문가 조언 표시
- 신뢰 지표

### 통증 신호등 시스템 (Pain Traffic Light System)

REHAB의 핵심 차별점: 운동 강도보다 통증 정도와 안전이 중요합니다.

#### Green (초록) - 안전
```css
--pain-safe: oklch(0.65 0.15 150);      /* #7FB885 - 통증 없음, 안전한 운동 가능 */
--pain-safe-light: oklch(0.95 0.06 150); /* #E8F5EA - 배경 */
--pain-safe-icon: oklch(0.70 0.18 150);  /* #8FC896 - 아이콘 */
```

**의미:** 통증 없음, 안전하게 운동 가능  
**사용 예시:** 통증 상태 표시, 안전한 운동 추천, 진행 가능 표시

#### Yellow (노랑) - 주의
```css
--pain-caution: oklch(0.75 0.15 70);    /* #E6C85A - 경미한 통증, 주의 필요 */
--pain-caution-light: oklch(0.96 0.06 70); /* #FDF8E8 - 배경 */
--pain-caution-icon: oklch(0.80 0.18 70);  /* #F0D06B - 아이콘 */
```

**의미:** 경미한 통증, 가벼운 운동만 가능, 주의 필요  
**사용 예시:** 통증 상태 표시, 주의 운동 추천, 경고 메시지

#### Red (빨강) - 위험
```css
--pain-danger: oklch(0.60 0.20 25);     /* #D97757 - 심한 통증, 운동 중단 권장 */
--pain-danger-light: oklch(0.96 0.08 25); /* #FDF0ED - 배경 */
--pain-danger-icon: oklch(0.65 0.22 25);  /* #E68A6F - 아이콘 */
```

**의미:** 심한 통증, 운동 중단 권장, 전문가 상담 필요  
**사용 예시:** 통증 상태 표시, 운동 중단 경고, 전문가 상담 안내

### Accent Colors (액센트 색상)

#### Warm Beige (따뜻한 베이지)
```css
--accent: oklch(0.85 0.04 60);          /* #E8DCC8 - 따뜻함과 편안함 */
--accent-light: oklch(0.95 0.02 60);   /* #F9F6F2 */
```

**사용 예시:** 강조 배경, 카드 배경, 부드러운 구분선

#### Lavender (라벤더)
```css
--accent-lavender: oklch(0.75 0.08 300); /* #C4B5D8 - 평온함 */
--accent-lavender-light: oklch(0.94 0.04 300); /* #F4F1F8 */
```

**사용 예시:** 특별 기능 강조, 프리미엄 기능 표시

### Neutral Colors (중립 색상)

부드럽고 따뜻한 그레이스케일입니다.

#### Light Mode
```css
--background: oklch(0.99 0 0);          /* #FDFDFD - 따뜻한 흰색 */
--foreground: oklch(0.20 0 0);          /* #333333 - 부드러운 검정 */
--card: oklch(1.0 0 0);                 /* #FFFFFF - 순수 흰색 */
--card-foreground: oklch(0.20 0 0);
--muted: oklch(0.96 0 0);               /* #F5F5F5 - 연한 회색 배경 */
--muted-foreground: oklch(0.50 0 0);    /* #808080 - 중간 회색 텍스트 */
--border: oklch(0.88 0 0);              /* #E0E0E0 - 부드러운 보더 */
--input: oklch(0.98 0 0);               /* #FAFAFA - 입력 필드 */
```

#### Dark Mode
```css
--background: oklch(0.12 0 0);          /* #1F1F1F - 따뜻한 다크 */
--foreground: oklch(0.95 0 0);          /* #F2F2F2 - 부드러운 화이트 */
--card: oklch(0.18 0 0);                /* #2E2E2E - 카드 배경 */
--card-foreground: oklch(0.95 0 0);
--muted: oklch(0.22 0 0);               /* #383838 - 연한 배경 */
--muted-foreground: oklch(0.65 0 0);    /* #A6A6A6 - 중간 텍스트 */
--border: oklch(0.30 0 0);              /* #4D4D4D - 보더 */
--input: oklch(0.18 0 0);               /* #2E2E2E - 입력 필드 */
```

### 색상 사용 가이드라인

1. **Sage Green**: 주요 액션, 브랜드 아이덴티티, 안전한 운동 표시
2. **Soft Teal**: 정보성 콘텐츠, 전문가 조언, 신뢰 지표
3. **통증 신호등**: 통증 상태에 따라 Green/Yellow/Red 사용 (필수)
4. **Warm Beige**: 부드러운 배경, 카드 구분
5. **Neutral**: 텍스트, 배경, 보더 등 기본 요소

---

## 통증 신호등 시스템

REHAB의 핵심 차별점입니다. 운동 강도보다 통증 정도와 안전이 중요합니다.

### 통증 상태 표시 컴포넌트

#### 통증 신호등 인디케이터
```css
.pain-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 2rem; /* 둥근 형태 */
  font-weight: 500;
  font-size: 0.875rem;
}

.pain-indicator-safe {
  background: var(--pain-safe-light);
  color: var(--pain-safe);
  border: 1px solid var(--pain-safe);
}

.pain-indicator-caution {
  background: var(--pain-caution-light);
  color: var(--pain-caution);
  border: 1px solid var(--pain-caution);
}

.pain-indicator-danger {
  background: var(--pain-danger-light);
  color: var(--pain-danger);
  border: 1px solid var(--pain-danger);
}
```

#### 통증 레벨 배지
```css
.pain-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%; /* 완전히 둥근 형태 */
  font-weight: 600;
  font-size: 0.75rem;
}

.pain-badge-safe {
  background: var(--pain-safe);
  color: white;
}

.pain-badge-caution {
  background: var(--pain-caution);
  color: white;
}

.pain-badge-danger {
  background: var(--pain-danger);
  color: white;
}
```

### 사용 예시

```tsx
// 통증 상태 표시
<div className="pain-indicator pain-indicator-safe">
  <Circle className="w-3 h-3 fill-pain-safe" />
  <span>통증 없음 - 안전하게 운동 가능</span>
</div>

<div className="pain-indicator pain-indicator-caution">
  <AlertTriangle className="w-3 h-3 fill-pain-caution" />
  <span>경미한 통증 - 가벼운 운동만 가능</span>
</div>

<div className="pain-indicator pain-indicator-danger">
  <XCircle className="w-3 h-3 fill-pain-danger" />
  <span>심한 통증 - 운동 중단 권장</span>
</div>
```

### 통증 기반 운동 추천 로직

1. **Green (안전)**: 모든 운동 가능, 강도 조절 가능
2. **Yellow (주의)**: 가벼운 스트레칭, 저강도 운동만 가능
3. **Red (위험)**: 운동 중단, 전문가 상담 권장

---

## 타이포그래피

### 폰트 패밀리

부드럽고 읽기 편한 폰트를 사용합니다.

#### Primary Font (본문)
```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", 
             "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif;
```

**특징:**
- 시스템 폰트 우선 사용 (성능 최적화)
- 부드러운 곡선과 가독성
- 날카롭지 않은 형태

#### Monospace Font (코드/데이터)
```css
font-family: "SF Mono", "Monaco", "Menlo", "Consolas", monospace;
```

### 타입 스케일

#### Display (대형 헤드라인)
```css
.font-display {
  font-size: 3.5rem;      /* 56px */
  font-weight: 600;       /* SemiBold (Bold 대신 부드럽게) */
  line-height: 1.2;
  letter-spacing: -0.01em; /* 날카롭지 않게 */
}
```

**사용 예시:** 메인 히어로 섹션, 랜딩 페이지 타이틀

#### Heading 1
```css
.font-h1 {
  font-size: 2.5rem;       /* 40px */
  font-weight: 600;        /* SemiBold */
  line-height: 1.3;
  letter-spacing: -0.005em;
}
```

**사용 예시:** 페이지 제목, 주요 섹션 헤더

#### Heading 2
```css
.font-h2 {
  font-size: 2rem;         /* 32px */
  font-weight: 600;        /* SemiBold */
  line-height: 1.4;
}
```

**사용 예시:** 섹션 제목, 카드 헤더

#### Heading 3
```css
.font-h3 {
  font-size: 1.5rem;       /* 24px */
  font-weight: 500;        /* Medium (부드럽게) */
  line-height: 1.5;
}
```

**사용 예시:** 서브섹션 제목, 리스트 헤더

#### Body Large
```css
.font-body-lg {
  font-size: 1.125rem;     /* 18px */
  font-weight: 400;        /* Regular */
  line-height: 1.7;        /* 넓은 줄간격으로 읽기 편하게 */
}
```

**사용 예시:** 중요 본문, 설명 텍스트

#### Body (기본)
```css
.font-body {
  font-size: 1rem;         /* 16px */
  font-weight: 400;        /* Regular */
  line-height: 1.7;        /* 넓은 줄간격 */
}
```

**사용 예시:** 일반 본문, 버튼 텍스트

#### Body Small
```css
.font-body-sm {
  font-size: 0.875rem;     /* 14px */
  font-weight: 400;        /* Regular */
  line-height: 1.6;
}
```

**사용 예시:** 보조 텍스트, 캡션, 메타 정보

#### Caption
```css
.font-caption {
  font-size: 0.75rem;      /* 12px */
  font-weight: 500;        /* Medium */
  line-height: 1.5;
  letter-spacing: 0.03em;  /* 대문자 변환 없이 부드럽게 */
}
```

**사용 예시:** 라벨, 태그, 작은 메타 정보

### 폰트 웨이트

- **400**: Regular (본문 기본)
- **500**: Medium (강조 텍스트, 부드러운 강조)
- **600**: SemiBold (헤딩, 중요 텍스트)
- **700**: Bold (사용 지양 - 너무 강함)

### 타이포그래피 가이드라인

1. **계층 구조**: Display > H1 > H2 > H3 > Body > Caption
2. **가독성**: 최소 16px 본문, 1.7 이상 line-height (넓은 줄간격)
3. **대비**: WCAG AA 기준 준수 (4.5:1 이상)
4. **부드러움**: Bold 대신 SemiBold, 날카로운 letter-spacing 지양

---

## UI 컴포넌트 스타일

### 버튼 (Buttons)

Planfit의 깔끔한 버튼 구조를 참고하되, 둥근 형태와 부드러운 색상으로 재구성합니다.

#### Primary Button
```css
.btn-primary {
  background: var(--primary); /* Sage Green */
  color: white;
  padding: 0.875rem 1.75rem;
  border-radius: 1rem; /* 둥근 모서리 */
  font-weight: 500; /* Medium - 부드럽게 */
  font-size: 1rem;
  transition: all 0.3s ease; /* 부드러운 트랜지션 */
  border: none;
}

.btn-primary:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(135, 169, 138, 0.25); /* 부드러운 그림자 */
}
```

**사용 예시:** 주요 액션 (코스 생성, 헬스장 찾기)

#### Secondary Button
```css
.btn-secondary {
  background: transparent;
  color: var(--primary);
  border: 2px solid var(--primary);
  padding: 0.875rem 1.75rem;
  border-radius: 1rem; /* 둥근 모서리 */
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: var(--primary-light);
  border-color: var(--primary-hover);
}
```

**사용 예시:** 보조 액션, 취소 버튼

#### Ghost Button
```css
.btn-ghost {
  background: transparent;
  color: var(--foreground);
  padding: 0.875rem 1.75rem;
  border-radius: 1rem; /* 둥근 모서리 */
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-ghost:hover {
  background: var(--muted);
}
```

**사용 예시:** 부가 액션, 링크 스타일 버튼

### 카드 (Cards)

Planfit의 깔끔한 카드 UI 구조를 참고하되, 둥근 모서리와 부드러운 그림자로 재구성합니다.

```css
.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 1.5rem; /* 더 둥근 모서리 */
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06); /* 부드러운 그림자 */
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1); /* 부드러운 호버 그림자 */
  transform: translateY(-2px);
  border-color: var(--primary-light);
}
```

**사용 예시:** 헬스장 카드, 코스 카드, 정보 카드

#### 통증 상태 카드
```css
.card-pain-safe {
  border-left: 4px solid var(--pain-safe);
  background: var(--pain-safe-light);
}

.card-pain-caution {
  border-left: 4px solid var(--pain-caution);
  background: var(--pain-caution-light);
}

.card-pain-danger {
  border-left: 4px solid var(--pain-danger);
  background: var(--pain-danger-light);
}
```

### 입력 필드 (Input Fields)

```css
.input {
  width: 100%;
  padding: 0.875rem 1.25rem;
  border: 1.5px solid var(--border);
  border-radius: 0.75rem; /* 둥근 모서리 */
  background: var(--input);
  color: var(--foreground);
  font-size: 1rem;
  transition: all 0.3s ease;
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(135, 169, 138, 0.1); /* 부드러운 포커스 링 */
}
```

### 배지 (Badges)

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px; /* 완전히 둥근 형태 */
  font-size: 0.75rem;
  font-weight: 500; /* Medium */
  letter-spacing: 0.02em;
}

.badge-primary {
  background: var(--primary-light);
  color: var(--primary-dark);
}

.badge-secondary {
  background: var(--secondary-light);
  color: var(--secondary-dark);
}
```

**사용 예시:** 태그, 상태 표시, 카테고리

### 모달 (Modals)

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4); /* 부드러운 오버레이 */
  backdrop-filter: blur(8px); /* 블러 효과 */
  z-index: 50;
}

.modal-content {
  background: var(--card);
  border-radius: 1.5rem; /* 둥근 모서리 */
  padding: 2rem;
  max-width: 32rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
}
```

---

## 간격 시스템

Planfit의 넓은 여백을 참고한 8px 기반 그리드 시스템입니다.

### 스페이싱 스케일

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-20: 5rem;    /* 80px */
--space-24: 6rem;    /* 96px */
```

### 사용 가이드라인

1. **컴포넌트 내부**: 8px, 12px, 16px
2. **컴포넌트 간**: 16px, 24px, 32px
3. **섹션 간**: 48px, 64px, 80px (넓은 여백)
4. **페이지 여백**: 최소 24px (모바일), 32px (데스크톱)

---

## 아이콘 & 이미지

### 아이콘

**라이브러리:** [Lucide React](https://lucide.dev/)

**스타일:**
- Outline 스타일 기본 사용
- 일관된 stroke-width (1.5px - 부드럽게)
- 최소 크기: 18px (모바일), 20px (데스크톱)
- 둥근 형태의 아이콘 선호

```tsx
import { Heart, Shield, AlertTriangle, Circle } from "lucide-react";

<Heart className="w-5 h-5 text-primary" strokeWidth={1.5} />
```

### 이미지

**가이드라인:**
- 16:9 또는 4:3 비율 권장
- 최적화된 WebP 포맷 사용
- Lazy loading 적용
- Alt 텍스트 필수
- 둥근 모서리 적용 (border-radius: 1rem)

**아바타/프로필:**
- 원형 (border-radius: 50%)
- 기본 크기: 40px, 64px, 96px
- 부드러운 그림자

---

## 애니메이션

### 트랜지션

부드럽고 자연스러운 애니메이션을 사용합니다.

```css
/* 기본 트랜지션 */
.transition-base {
  transition: all 0.3s ease; /* 0.2s → 0.3s로 더 부드럽게 */
}

/* 빠른 트랜지션 */
.transition-fast {
  transition: all 0.2s ease;
}

/* 느린 트랜지션 */
.transition-slow {
  transition: all 0.4s ease;
}
```

### 호버 효과

```css
.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1); /* 부드러운 그림자 */
}
```

### 로딩 애니메이션

```css
@keyframes pulse-soft {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.spinner-soft {
  animation: pulse-soft 1.5s ease-in-out infinite;
}
```

### 애니메이션 가이드라인

1. **성능**: transform, opacity만 애니메이션 (GPU 가속)
2. **지속 시간**: 0.3s ~ 0.4s (부드럽게)
3. **이징**: ease, ease-in-out 사용
4. **접근성**: prefers-reduced-motion 존중

---

## 접근성

### 색상 대비

- **본문 텍스트**: 최소 4.5:1 (WCAG AA)
- **큰 텍스트 (18px+)**: 최소 3:1 (WCAG AA)
- **인터랙티브 요소**: 최소 3:1
- **통증 신호등**: 색상뿐만 아니라 아이콘과 텍스트로도 구분

### 키보드 네비게이션

- 모든 인터랙티브 요소는 키보드로 접근 가능
- 포커스 인디케이터 명확히 표시 (부드러운 링)
- Tab 순서 논리적

### 스크린 리더

- 의미론적 HTML 사용
- ARIA 라벨 적절히 사용
- Alt 텍스트 제공
- 통증 상태는 텍스트로도 명확히 전달

### 모션 감소

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 구현 예시

### Tailwind CSS 설정

`app/globals.css`에 다음 색상을 추가하세요:

```css
@theme inline {
  /* Primary Colors - Sage Green */
  --color-primary: oklch(0.65 0.10 150);
  --color-primary-hover: oklch(0.60 0.10 150);
  --color-primary-light: oklch(0.92 0.04 150);
  --color-primary-dark: oklch(0.50 0.12 150);
  
  /* Secondary Colors - Soft Teal */
  --color-secondary: oklch(0.60 0.12 200);
  --color-secondary-hover: oklch(0.55 0.12 200);
  --color-secondary-light: oklch(0.90 0.05 200);
  --color-secondary-dark: oklch(0.45 0.14 200);
  
  /* Pain Traffic Light System */
  --color-pain-safe: oklch(0.65 0.15 150);
  --color-pain-safe-light: oklch(0.95 0.06 150);
  --color-pain-caution: oklch(0.75 0.15 70);
  --color-pain-caution-light: oklch(0.96 0.06 70);
  --color-pain-danger: oklch(0.60 0.20 25);
  --color-pain-danger-light: oklch(0.96 0.08 25);
  
  /* Accent */
  --color-accent: oklch(0.85 0.04 60);
  --color-accent-light: oklch(0.95 0.02 60);
  --color-accent-lavender: oklch(0.75 0.08 300);
  --color-accent-lavender-light: oklch(0.94 0.04 300);
}
```

### 컴포넌트 사용 예시

```tsx
// Primary Button (둥근 형태)
<Button className="bg-primary text-white hover:bg-primary-hover rounded-2xl px-7 py-3.5 font-medium">
  코스 생성하기
</Button>

// Card (Planfit 스타일 참고, 둥근 모서리)
<div className="bg-card border border-border rounded-3xl p-6 hover:shadow-lg transition-all hover:-translate-y-0.5">
  <h3 className="text-h2 font-semibold mb-2">헬스장 이름</h3>
  <p className="text-body text-muted-foreground">설명 텍스트</p>
</div>

// 통증 신호등 배지
<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pain-safe-light text-pain-safe border border-pain-safe">
  <Circle className="w-3 h-3 fill-pain-safe" />
  <span className="text-sm font-medium">통증 없음 - 안전하게 운동 가능</span>
</div>

// Badge (둥근 형태)
<span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium bg-primary-light text-primary-dark">
  재활 친화
</span>
```

---

## Planfit과의 차별점 요약

| 요소 | Planfit | REHAB |
|------|---------|-------|
| **무드** | 성능/근육 중심 | 치유/회복 중심 |
| **컬러** | 강렬한 원색 | 세이지 그린, 소프트 틸 (심리적 안정) |
| **형태** | 날카로운 모서리 | 둥근 모서리 (Rounded) |
| **강조** | 운동 강도 | 통증 정도와 안전 |
| **시각 요소** | 강렬한 대비 | 부드러운 그림자와 색상 |
| **카드 UI** | 깔끔한 구조 (참고) | 깔끔한 구조 + 둥근 형태 + 부드러운 색상 |

---

## 참고 자료

- [Planfit Design](https://wwit.design/2023/07/24/planfit/): 깔끔한 카드 UI 구조 참고
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)

---

**마지막 업데이트:** 2025-01-XX  
**버전:** 2.0.0 (치유/회복 무드로 재구성)
