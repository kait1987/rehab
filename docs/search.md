# 검색 전략 문서

**작성일**: 2026-01-07  
**Phase**: 3.2 Full Text Search 도입

---

## 현재 구현 상태

### ✅ Full Text Search (FTS)

**구현 완료**: PostgreSQL의 `tsvector`와 `tsquery`를 사용한 Full Text Search

**특징**:
- 헬스장 이름, 주소, 설명을 기반으로 검색
- `plainto_tsquery`를 사용하여 SQL Injection 방지
- `ts_rank`로 관련도 점수 계산
- GIN 인덱스로 빠른 검색 성능

**사용 방법**:
```typescript
// API 요청 예시
GET /api/gyms/search?lat=37.5665&lng=126.9780&radius=1000&query=강남 헬스장
```

**정렬 전략**:
- 검색어가 있으면: 관련도(ts_rank) 우선 → 거리순
- 검색어가 없으면: 거리순

---

## 향후 확장 계획: Semantic Search (벡터 검색)

### 설계 개요

**목표**: 의미 기반 검색을 통해 사용자 의도를 더 정확히 파악

**예시**:
- 사용자 입력: "조용한 재활 헬스장"
- FTS: "조용한", "재활", "헬스장" 키워드 매칭
- Semantic Search: "한산한", "재활 운동", "피트니스 센터" 등 유사 의미도 매칭

---

### 데이터베이스 스키마 설계

#### 옵션 1: 별도 테이블 (권장)

```sql
-- gym_embeddings 테이블 생성
create table public.gym_embeddings (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  embedding vector(1536), -- OpenAI text-embedding-3-small 기준 (1536차원)
  source_text text, -- 임베딩 생성에 사용된 텍스트 (name + address + description)
  model_version varchar(50) default 'text-embedding-3-small',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint gym_embeddings_unique unique (gym_id)
);

-- 벡터 검색용 인덱스 (IVFFlat 또는 HNSW)
-- 주의: pgvector 확장 필요
create extension if not exists vector;

create index idx_gym_embeddings_vector_ivfflat
  on public.gym_embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100); -- 데이터 크기에 따라 조정

comment on table public.gym_embeddings is '헬스장 벡터 임베딩 (Semantic Search용)';
```

**장점**:
- 기존 `gyms` 테이블 구조 변경 불필요
- 임베딩 모델 버전 관리 용이
- 벡터 크기 변경 시 유연함

**단점**:
- JOIN 필요 (성능 고려 필요)

---

#### 옵션 2: gyms 테이블에 컬럼 추가

```sql
-- gyms 테이블에 embedding 컬럼 추가
alter table public.gyms
add column embedding vector(1536);

create index idx_gyms_embedding_ivfflat
  on public.gyms
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
```

**장점**:
- JOIN 불필요 (성능 우수)
- 단순한 구조

**단점**:
- 기존 테이블 구조 변경 필요
- 모델 버전 관리 어려움

---

### 임베딩 생성 전략

**기준 텍스트 구성**:
```typescript
const sourceText = [
  gym.name,
  gym.address,
  gym.description,
  // 시설 정보 요약
  gym.facilities?.isQuiet ? '조용한' : '',
  gym.facilities?.hasRehabEquipment ? '재활 기구' : '',
  gym.facilities?.hasPtCoach ? 'PT 코치' : '',
].filter(Boolean).join(' ');
```

**임베딩 모델**:
- **권장**: OpenAI `text-embedding-3-small` (1536차원)
  - 비용 효율적
  - 한국어 지원 양호
- **대안**: OpenAI `text-embedding-3-large` (3072차원)
  - 더 높은 정확도
  - 비용 증가

**생성 시점**:
- 헬스장 생성/업데이트 시 자동 생성 (트리거 또는 애플리케이션 레벨)
- 배치 작업으로 주기적 갱신 (선택)

---

### 하이브리드 검색 전략

**조합 방식**:

```typescript
// 1. Full Text Search로 후보 선정 (빠른 필터링)
const ftsResults = await searchWithFTS(query, bbox);

// 2. Semantic Search로 관련도 재계산
const semanticResults = await searchWithSemantic(query, ftsResults.map(g => g.id));

// 3. 점수 결합 (가중 평균)
const hybridResults = combineScores(ftsResults, semanticResults, {
  ftsWeight: 0.4,  // FTS 가중치
  semanticWeight: 0.6, // Semantic 가중치
});

// 4. 최종 정렬 (결합 점수 → 거리순)
```

**점수 결합 공식**:
```
finalScore = (ftsScore * ftsWeight) + (semanticScore * semanticWeight)
```

**정렬 우선순위**:
1. 결합 점수 (내림차순)
2. 거리 (오름차순)

---

### 구현 시 고려사항

#### 1. pgvector 확장 설치

```sql
-- Supabase에서 pgvector 확장 활성화
create extension if not exists vector;
```

#### 2. 인덱스 선택

- **IVFFlat**: 빠른 검색, 약간의 정확도 손실
  - 적합: 데이터 10만 개 이하
- **HNSW**: 높은 정확도, 더 많은 메모리 사용
  - 적합: 데이터 10만 개 이상 또는 높은 정확도 요구

#### 3. 벡터 차원

- OpenAI `text-embedding-3-small`: 1536차원
- OpenAI `text-embedding-3-large`: 3072차원
- **주의**: 차원 변경 시 인덱스 재생성 필요

#### 4. 비용 관리

- 임베딩 생성 비용: OpenAI API 호출 비용
- 저장 비용: 벡터 데이터 저장 공간
- **권장**: 배치 작업으로 주기적 갱신 (예: 일 1회)

---

### 예상 구현 단계

1. **Phase 1**: pgvector 확장 설치 및 스키마 설계
2. **Phase 2**: 임베딩 생성 배치 작업 구현
3. **Phase 3**: Semantic Search 쿼리 구현
4. **Phase 4**: 하이브리드 검색 전략 통합
5. **Phase 5**: 성능 최적화 및 모니터링

---

### 참고 자료

- [pgvector 문서](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings 가이드](https://platform.openai.com/docs/guides/embeddings)
- [Supabase Vector 검색 가이드](https://supabase.com/docs/guides/ai/vector-columns)

