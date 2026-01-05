# 네이버맵 API 설정 가이드

이 문서는 네이버 클라우드 플랫폼에서 네이버맵 API 키를 발급받고 프로젝트에 설정하는 방법을 안내합니다.

## 목차

1. [네이버 클라우드 플랫폼 회원가입](#1-네이버-클라우드-플랫폼-회원가입)
2. [Maps 서비스 애플리케이션 등록](#2-maps-서비스-애플리케이션-등록)
3. [Client ID 및 Client Secret 발급](#3-client-id-및-client-secret-발급)
4. [Dynamic Map 설정 확인](#4-dynamic-map-설정-확인)
5. [환경변수 설정](#5-환경변수-설정)
6. [API 사용량 한도 확인](#6-api-사용량-한도-확인)
7. [문제 해결](#7-문제-해결)

---

## 1. 네이버 클라우드 플랫폼 회원가입

1. [네이버 클라우드 플랫폼](https://www.ncloud.com/)에 접속합니다.
2. 우측 상단의 **회원가입** 버튼을 클릭합니다.
3. 네이버 계정으로 로그인하거나 새 계정을 만듭니다.
4. 회원가입 절차를 완료합니다.

**참고**: 개인/일반 기업용 콘솔로 가입하면 됩니다. (공공기관용 및 금융기관용 콘솔은 별도 절차가 필요합니다)

---

## 2. Maps 서비스 애플리케이션 등록

1. [네이버 클라우드 플랫폼 콘솔](https://console.ncloud.com/)에 로그인합니다.
2. 좌측 메뉴에서 **Services** > **Application Services** > **Maps** > **Application**을 선택합니다.
3. **Application 등록** 버튼을 클릭합니다.
4. 다음 정보를 입력합니다:
   - **Application 이름**: 프로젝트 이름 (예: "REHAB 재활운동 앱")
   - **Service 선택**: **Maps** 선택
   - **환경**: **Web** 선택
   - **도메인**: 개발 환경에서는 `localhost` 또는 실제 도메인 입력
     - 예: `localhost:3000`, `your-domain.com`
   - **설명**: 선택 사항

5. **등록** 버튼을 클릭합니다.

**중요**: 
- 도메인은 실제 사용할 도메인을 정확히 입력해야 합니다.
- 개발 환경과 프로덕션 환경을 분리하려면 각각 별도의 Application을 등록하는 것을 권장합니다.

---

## 3. Client ID 및 Client Secret 발급

1. 등록한 Application을 선택합니다.
2. **Application 상세** 화면에서 다음 정보를 확인합니다:
   - **Client ID**: 클라이언트 아이디 (복사하여 보관)
   - **Client Secret**: 클라이언트 시크릿 (복사하여 보관)

**보안 주의사항**:
- **Client Secret**은 절대 공개되지 않도록 주의하세요.
- Git 저장소에 커밋하지 마세요 (`.env` 파일은 `.gitignore`에 포함되어 있습니다).
- 프로덕션 환경에서는 환경변수로 안전하게 관리하세요.

---

## 4. Dynamic Map 설정 확인

네이버 지도 API v3를 사용하려면 **Dynamic Map** 설정이 활성화되어 있어야 합니다.

1. **Application 상세** 화면에서 **Application 수정** 버튼을 클릭합니다.
2. **Service 선택** 섹션에서 **Dynamic Map**이 체크되어 있는지 확인합니다.
3. 체크되어 있지 않다면 체크하고 저장합니다.

**중요**: Dynamic Map 설정이 누락되면 API 호출 시 429 에러가 발생할 수 있습니다.

**참고**: PRD.md에 따르면 네이버 지도 API v3는 Client ID 방식이며, NCP에서 Web Dynamic Map 설정이 누락되면 429 에러가 날 수 있어 설정 확인이 필요합니다.

---

## 5. 환경변수 설정

프로젝트 루트 디렉토리의 `.env` 파일에 다음 환경변수를 추가합니다:

```env
# 네이버맵 API 설정
# 서버 사이드 API 호출용 (장소 검색 등)
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# 클라이언트 사이드 지도 표시용 (네이버 지도 API v3)
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_naver_map_client_id
```

**설명**:
- `NAVER_CLIENT_ID`와 `NAVER_CLIENT_SECRET`: 서버 사이드에서 네이버 지역 검색 API를 호출할 때 사용합니다. (API Routes 또는 Server Actions)
- `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`: 클라이언트 사이드에서 네이버 지도를 표시할 때 사용합니다. (`NEXT_PUBLIC_` 접두사가 붙으면 클라이언트 사이드에서 접근 가능)

**주의사항**:
- `NAVER_CLIENT_SECRET`은 절대 클라이언트 사이드에 노출되지 않도록 주의하세요.
- 실제 값으로 교체해야 합니다 (`your_naver_client_id` → 실제 Client ID).

---

## 6. API 사용량 한도 확인

네이버 지역 검색 API는 **일일 25,000회** 호출 한도가 있습니다.

### 한도 확인 방법

1. [네이버 클라우드 플랫폼 콘솔](https://console.ncloud.com/)에 로그인합니다.
2. 좌측 메뉴에서 **Services** > **Application Services** > **Maps** > **Application**을 선택합니다.
3. 등록한 Application을 선택합니다.
4. **사용량** 또는 **통계** 메뉴에서 현재 사용량을 확인합니다.

### 모니터링

프로젝트에는 자동 모니터링 기능이 구현되어 있습니다:

- 일/주 단위 호출 수를 자동으로 추적합니다.
- 한도 70% 도달 시 경고 로그가 출력됩니다.
- 한도 80% 도달 시 위험 로그가 출력됩니다.

**참고**: PRD.md에 따르면 일/주 단위 호출 수를 로그로 기록하고, 한도 70-80% 도달 시 알림이 필요합니다.

### 한도 초과 시

- 한도가 초과되면 API 호출이 실패합니다.
- 필요 시 유료 플랜으로 업그레이드를 검토하세요.
- 캐싱을 활용하여 API 호출을 최소화하세요. (프로젝트에는 24시간 TTL 캐싱이 구현 예정)

---

## 7. 문제 해결

### 429 에러 (Too Many Requests)

**원인**:
- Dynamic Map 설정이 누락되었을 수 있습니다.
- API 호출 한도를 초과했을 수 있습니다.

**해결 방법**:
1. [Dynamic Map 설정 확인](#4-dynamic-map-설정-확인) 섹션을 참고하여 설정을 확인합니다.
2. [API 사용량 한도 확인](#6-api-사용량-한도-확인) 섹션을 참고하여 사용량을 확인합니다.

### 환경변수 인식 안 됨

**원인**:
- `.env` 파일이 프로젝트 루트에 없을 수 있습니다.
- 환경변수 이름이 잘못되었을 수 있습니다.
- 서버를 재시작하지 않았을 수 있습니다.

**해결 방법**:
1. `.env` 파일이 프로젝트 루트 디렉토리에 있는지 확인합니다.
2. 환경변수 이름이 정확한지 확인합니다 (대소문자 구분).
3. 개발 서버를 재시작합니다:
   ```bash
   # 서버 중지 후
   pnpm dev
   ```

### Client ID/Secret 오류

**원인**:
- 잘못된 Client ID 또는 Client Secret을 사용했을 수 있습니다.
- Application이 삭제되었거나 비활성화되었을 수 있습니다.

**해결 방법**:
1. [네이버 클라우드 플랫폼 콘솔](https://console.ncloud.com/)에서 Client ID와 Client Secret을 다시 확인합니다.
2. Application이 활성화되어 있는지 확인합니다.
3. `.env` 파일의 값이 정확한지 확인합니다 (공백, 따옴표 등 주의).

---

## 추가 리소스

- [네이버 지도 API v3 공식 문서](https://navermaps.github.io/maps.js.ncp/)
- [네이버 지역 검색 API 공식 문서](https://developers.naver.com/docs/serviceapi/search/local/local.md)
- [네이버 클라우드 플랫폼 콘솔](https://console.ncloud.com/)

---

## 다음 단계

환경변수 설정이 완료되면 다음 작업을 진행할 수 있습니다:

1. [2.2 장소 검색 API 연동](TODO.md#22-장소-검색-api-연동) - 네이버맵 장소 검색 API 연동
2. [4.5 헬스장 리스트/지도 UI](TODO.md#45-헬스장-리스트지도-ui) - 네이버맵 지도 컴포넌트 연동

