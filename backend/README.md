# AI Professor

Kotlin + Spring Boot 기반의 교육 자료 요약 및 예상 문제 생성 백엔드 시스템

## 기술 스택

- Kotlin 1.9.21
- Spring Boot 3.2.0
- MySQL 8.0
- Redis 7
- Flyway (Database Migration)
- Claude Sonnet 4.5 API
- JWT Authentication
- Clean Architecture
- ktlint
- Docker & Docker Compose

## 주요 기능

1. **인증 시스템**
   - JWT 기반 로그인/로그아웃
   - IP 및 MAC 주소 기반 동시 접속 제한 (최대 3세션)

2. **문서 처리**
   - PDF 파일을 Base64로 입력받아 처리
   - 최대 30MB 크기 제한
   - Claude Sonnet 4.5 API를 통한 자료 요약
   - Claude Sonnet 4.5 API를 통한 예상 문제 생성
   - Markdown을 PDF로 변환하여 결과 반환 (Noto Sans KR 웹폰트 사용)
   - 문서 처리 내역 조회 (페이지네이션 및 필터링 지원)

3. **API 엔드포인트**
   - `POST /api/auth/login` - 로그인
   - `POST /api/auth/logout` - 로그아웃
   - `POST /api/documents/summary` - 자료 요약
   - `POST /api/documents/exam-questions` - 예상 문제 생성
   - `GET /api/documents/history` - 문서 처리 내역 조회

## 프로젝트 구조

```
backend/
├── src/
│   ├── main/
│   │   ├── kotlin/com/aiprofessor/
│   │   │   ├── domain/           # 도메인 계층
│   │   │   │   ├── user/
│   │   │   │   ├── session/
│   │   │   │   └── document/
│   │   │   ├── application/      # 애플리케이션 계층
│   │   │   │   ├── auth/
│   │   │   │   └── document/
│   │   │   ├── infrastructure/   # 인프라 계층
│   │   │   │   ├── user/
│   │   │   │   ├── session/
│   │   │   │   ├── claude/
│   │   │   │   ├── util/
│   │   │   │   ├── config/
│   │   │   │   └── security/
│   │   │   └── presentation/     # 프레젠테이션 계층
│   │   │       ├── auth/
│   │   │       └── document/
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── db/migration/     # Flyway 마이그레이션
│   │       ├── prompts/          # Claude system prompts
│   │       └── fonts/            # Noto Sans KR 웹폰트
│   └── test/                      # 테스트 코드
├── build.gradle.kts
├── Dockerfile
├── docker-compose.yml
├── Makefile
└── README.md
```

## 설치 및 실행

### 사전 요구사항

- JDK 17
- Docker & Docker Compose
- MySQL 8.0
- Redis 7

### 환경 설정

1. `.env.example`을 `.env`로 복사하고 필요한 값 설정:

```bash
cp .env.example .env
```

2. `.env` 파일에서 다음 값들을 설정:
   - `JWT_SECRET`: JWT 토큰 생성에 사용할 시크릿 키 (최소 256비트)
   - `CLAUDE_API_KEY`: Claude API 키

### 로컬 개발 환경 실행

```bash
# 테스트 실행
make test

# 개발 모드 실행 (데이터베이스 별도 설치 필요)
make dev

# Docker Compose를 통한 개발 환경 실행
make dev-docker
```

**개발 환경 테스트 계정**

개발 모드(`make dev` 또는 `make dev-docker`)로 실행하면 테스트 유저가 자동으로 생성됩니다:

- **Username**: `testuser`
- **Password**: `test1234`
- **Email**: `test@example.com`

### Docker Compose로 전체 환경 실행

```bash
# 모든 서비스 시작
make docker-up

# 로그 확인
make docker-logs

# 모든 서비스 중지
make docker-down
```

## 테스트

```bash
# 테스트 실행
make test

# 테스트 리포트 확인
make test-report

# ktlint 검사
make lint

# 코드 포맷팅
make format
```

## CI/CD

### GitHub Actions

프로젝트는 두 가지 GitHub Actions 워크플로우를 제공합니다:

1. **CI (Continuous Integration)**
   - main 브랜치에 push 또는 PR 생성 시 자동 실행
   - ktlint 검사
   - 테스트 실행
   - 테스트 결과 아티팩트 업로드

2. **Docker Publish**
   - 태그 생성 시 자동 실행 (예: `v1.0.0`)
   - Docker 이미지 빌드 및 Docker Hub에 푸시
   - `latest` 및 버전 태그로 이미지 생성

### GitHub Secrets 설정

Docker Hub에 이미지를 푸시하려면 다음 Secrets를 설정해야 합니다:

- `DOCKER_USERNAME`: Docker Hub 사용자명
- `DOCKER_PASSWORD`: Docker Hub 비밀번호 또는 액세스 토큰

## API 사용 예시

### 로그인

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test1234",
    "macAddress": "00:11:22:33:44:55"
  }'
```

### 로그아웃

```bash
curl -X POST http://localhost:8080/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 자료 요약

```bash
curl -X POST http://localhost:8080/api/documents/summary \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "pdfBase64": "BASE64_ENCODED_PDF",
    "userPrompt": "이 자료를 한국어로 요약해주세요."
  }'
```

### 예상 문제 생성

```bash
curl -X POST http://localhost:8080/api/documents/exam-questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "pdfBase64": "BASE64_ENCODED_PDF",
    "userPrompt": "이 자료를 바탕으로 예상 문제를 만들어주세요."
  }'
```

### 문서 처리 내역 조회

```bash
# 전체 조회 (기본 페이지네이션)
curl -X GET http://localhost:8080/api/documents/history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 특정 처리 타입으로 필터링
curl -X GET "http://localhost:8080/api/documents/history?processingType=SUMMARY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 커스텀 페이지네이션
curl -X GET "http://localhost:8080/api/documents/history?page=0&size=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 필터링 + 페이지네이션
curl -X GET "http://localhost:8080/api/documents/history?processingType=EXAM_QUESTIONS&page=0&size=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**쿼리 파라미터:**
- `page` (optional, default: 0) - 페이지 번호 (0부터 시작)
- `size` (optional, default: 20) - 페이지 크기
- `processingType` (optional) - 처리 타입으로 필터링 (`SUMMARY` 또는 `EXAM_QUESTIONS`)

**응답 예시:**
```json
{
  "content": [
    {
      "id": 1,
      "processingType": "SUMMARY",
      "userPrompt": "이 자료를 요약해주세요.",
      "inputBase64": "BASE64_ENCODED_INPUT_PDF",
      "outputBase64": "BASE64_ENCODED_OUTPUT_PDF",
      "createdAt": "2025-10-13T12:00:00"
    }
  ],
  "pageNumber": 0,
  "pageSize": 20,
  "totalElements": 100,
  "totalPages": 5,
  "isLast": false
}
```

## 데이터베이스 마이그레이션 (Flyway)

프로젝트는 Flyway를 사용하여 데이터베이스 스키마를 버전 관리합니다.

### 마이그레이션 파일 위치

마이그레이션 스크립트는 `src/main/resources/db/migration/` 디렉토리에 위치합니다.

### 마이그레이션 파일 명명 규칙

```
V{version}__{description}.sql
```

예시:
- `V1__Create_users_table.sql`
- `V2__Add_email_index.sql`

### Flyway 명령어

```bash
# 마이그레이션 상태 확인
./gradlew flywayInfo

# 마이그레이션 검증
./gradlew flywayValidate

# 마이그레이션 적용
./gradlew flywayMigrate

# 데이터베이스 정리 (주의: 모든 데이터 삭제)
./gradlew flywayClean
```

### 새 마이그레이션 추가하기

1. `src/main/resources/db/migration/` 디렉토리에 새 SQL 파일 생성
2. 파일명은 `V{다음_버전}__{설명}.sql` 형식 사용
3. SQL 문 작성
4. 애플리케이션 실행 시 자동으로 마이그레이션 적용

자세한 내용은 `src/main/resources/db/migration/README.md`를 참조하세요.

## 프로파일

프로젝트는 세 가지 프로파일을 지원합니다:

- `test`: 테스트 환경
- `dev`: 개발 환경
- `prod`: 프로덕션 환경

각 프로파일은 `application.yml`에서 설정을 관리하며, Flyway가 데이터베이스 스키마를 자동으로 관리합니다.

## 라이선스

MIT License
