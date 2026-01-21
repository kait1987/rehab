# n8n 워크플로우 및 이미지 생성 가이드

이 문서는 n8n 워크플로우와 직접 스크립트를 사용하여 운동 이미지를 생성하는 방법을 설명합니다.

## 목차

1. [개요](#개요)
2. [환경 설정](#환경-설정)
3. [방법 1: n8n 워크플로우 사용](#방법-1-n8n-워크플로우-사용)
4. [방법 2: 직접 스크립트 실행](#방법-2-직접-스크립트-실행)
5. [트러블슈팅](#트러블슈팅)

## 개요

이 프로젝트는 `n8n_exercises.json` 파일에 작성된 상세한 프롬프트를 사용하여 Gemini API로 운동 이미지를 생성합니다. 두 가지 방법을 제공합니다:

- **n8n 워크플로우**: n8n 플랫폼에서 시각적으로 워크플로우를 실행
- **직접 스크립트**: Node.js 스크립트를 직접 실행

## 환경 설정

### 1. Gemini API 키 발급

1. [Google AI Studio](https://makersuite.google.com/app/apikey)에 접속
2. API 키 생성
3. 생성된 API 키를 복사

### 2. 환경변수 설정

프로젝트 루트의 `.env.local` 파일에 다음을 추가:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. 데이터 파일 확인

`n8n_exercises.json` 파일이 프로젝트 루트에 있는지 확인합니다. 이 파일에는 다음과 같은 구조의 운동 데이터가 포함되어 있어야 합니다:

```json
[
  {
    "name": "운동 이름",
    "filename": "파일명.png",
    "prompt": "상세한 이미지 생성 프롬프트"
  }
]
```

## 방법 1: n8n 워크플로우 사용

### 1단계: 워크플로우 파일 생성

터미널에서 다음 명령어를 실행하여 n8n 워크플로우 JSON 파일을 생성합니다:

```bash
node scripts/create-nano-banana-workflow.js
```

이 명령어는 `n8n_nano_banana_workflow.json` 파일을 프로젝트 루트에 생성합니다.

### 2단계: n8n에 워크플로우 임포트

1. n8n 웹 인터페이스에 접속
2. "Workflows" 메뉴로 이동
3. "Import from File" 클릭
4. 생성된 `n8n_nano_banana_workflow.json` 파일 선택
5. 워크플로우가 임포트되면 편집 화면으로 이동

### 3단계: API 키 설정

1. 워크플로우에서 "Gemini API Call" 노드를 클릭
2. "Query Parameters" 섹션에서 `key` 필드 찾기
3. `YOUR_GEMINI_API_KEY_HERE`를 실제 Gemini API 키로 교체
4. 저장

### 4단계: 워크플로우 실행

1. 워크플로우 상단의 "Execute Workflow" 버튼 클릭
2. 워크플로우가 자동으로 각 운동 이미지를 생성하고 저장합니다
3. 진행 상황은 n8n 인터페이스에서 확인할 수 있습니다

### 워크플로우 구조

워크플로우는 다음과 같은 노드들로 구성되어 있습니다:

1. **Manual Trigger**: 워크플로우 시작
2. **Set Exercise List**: `n8n_exercises.json` 데이터 로드
3. **Split In Batches**: 한 번에 하나씩 처리
4. **Gemini API Call**: Gemini API로 이미지 생성 요청
5. **Extract Base64 Image**: API 응답에서 base64 이미지 추출
6. **Wait (Rate Limit)**: API Rate Limit 방지를 위한 2초 대기
7. **Save to Disk**: 이미지를 `public/images/exercises/`에 저장
8. **Loop**: 다음 항목으로 반복

## 방법 2: 직접 스크립트 실행

### 1단계: 환경변수 확인

`.env.local` 파일에 `GEMINI_API_KEY`가 설정되어 있는지 확인합니다.

### 2단계: 스크립트 실행

터미널에서 다음 명령어를 실행합니다:

```bash
pnpm tsx scripts/generate-images-gemini.ts
```

### 3단계: 진행 상황 확인

스크립트는 다음과 같은 정보를 출력합니다:

- 로드된 운동 개수
- 각 이미지 생성 성공/실패 여부
- 진행률 (10개마다)
- 최종 요약 통계

### 스크립트 기능

- **자동 재시도**: 실패 시 최대 3회까지 자동 재시도
- **Rate Limiting**: API 제한을 피하기 위해 요청 간 2초 대기
- **중복 방지**: 이미 존재하는 이미지는 건너뜀
- **에러 핸들링**: 상세한 에러 메시지 제공
- **진행률 표시**: 실시간 진행 상황 표시

## 트러블슈팅

### 문제 1: "GEMINI_API_KEY environment variable is not set" 에러

**해결 방법**:
1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 파일에 `GEMINI_API_KEY=your_key_here` 형식으로 추가
3. 스크립트를 다시 실행

### 문제 2: "n8n_exercises.json not found" 에러

**해결 방법**:
1. `n8n_exercises.json` 파일이 프로젝트 루트에 있는지 확인
2. 파일이 없다면 `scripts/generate-n8n-json.js`를 실행하여 생성

### 문제 3: Gemini API Rate Limit 에러

**증상**: "429 Too Many Requests" 또는 "Quota exceeded" 에러

**해결 방법**:
1. 요청 간 대기 시간을 늘립니다 (스크립트의 `wait(2000)` 값을 증가)
2. n8n 워크플로우의 "Wait (Rate Limit)" 노드 시간을 늘립니다
3. Google Cloud Console에서 API 할당량 확인

### 문제 4: "No image data found in Gemini API response" 에러

**원인**: Gemini API가 이미지를 반환하지 않았습니다.

**해결 방법**:
1. 프롬프트가 이미지 생성 요청 형식인지 확인
2. API 응답을 확인하여 실제 반환 형식 확인
3. Gemini API 문서에서 최신 이미지 생성 방법 확인

### 문제 5: 생성된 이미지가 깨지거나 손상됨

**해결 방법**:
1. Base64 디코딩이 올바르게 되었는지 확인
2. MIME 타입이 올바른지 확인 (image/png, image/jpeg 등)
3. 파일 저장 경로와 권한 확인

### 문제 6: n8n 워크플로우에서 이미지 추출 실패

**해결 방법**:
1. "Extract Base64 Image" 노드의 JavaScript 코드 확인
2. Gemini API 응답 구조가 변경되었는지 확인
3. n8n 로그에서 실제 API 응답 확인

## 추가 정보

### 이미지 저장 위치

생성된 이미지는 다음 위치에 저장됩니다:

```
public/images/exercises/
```

### 데이터베이스 연동 (선택사항)

생성된 이미지를 데이터베이스에 연결하려면 별도의 스크립트를 실행해야 합니다:

```bash
# 이미지 URL을 데이터베이스에 업데이트하는 스크립트 (향후 추가 예정)
pnpm tsx scripts/update-exercise-image-urls.ts
```

### 프롬프트 수정

이미지 생성 프롬프트를 수정하려면 `n8n_exercises.json` 파일의 각 항목의 `prompt` 필드를 수정한 후 다시 실행하면 됩니다.

### 배치 처리

대량의 이미지를 생성할 때는:

1. **n8n 워크플로우**: 백그라운드에서 실행 가능, 중단 후 재개 가능
2. **직접 스크립트**: 터미널 세션이 유지되어야 함

## 참고 자료

- [Gemini API 문서](https://ai.google.dev/docs)
- [n8n 문서](https://docs.n8n.io/)
- [프로젝트 README](../README.md)

