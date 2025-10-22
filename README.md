<div align="center">

<!-- 프로젝트 로고 -->
<img src="https://imagedelivery.net/R9FsTLXBX6-6fZLUqzGBBg/36c33d91-032e-4b46-7b4c-ec1dd09d0b00/public" alt="Logo" width="150" height="150">

# AI Professor

### AI 기반 교육 자료 요약 및 문제 생성 플랫폼

교육 자료 PDF를 업로드하면 AI가 자동으로 핵심 내용을 요약하고 예상 문제를 생성해주는 웹 애플리케이션

[Features](#features) • [Tech Stack](#tech-stack) • [Architecture](#architecture) • [Roadmap](#roadmap)

<!-- 프로젝트 스크린샷 -->
<img src="https://imagedelivery.net/R9FsTLXBX6-6fZLUqzGBBg/aa211d55-c2d1-44e9-12b5-a20c9e638600/public" alt="Screenshot" width="700">

</div>

---

## About The Project

<!-- 데모 GIF 또는 비디오 -->
<div align="center">
  <img src="docs/images/demo.gif" alt="Demo" width="700">
</div>

<br>
AI Professor는 학생들의 효율적인 학습을 돕기 위해 개발된 웹 애플리케이션입니다. Claude AI의 강력한 문서 분석 능력을 활용하여 복잡한 교육 자료를 명확하고 체계적인 요약본으로 변환하고, 학습 내용을 점검할 수 있는 예상 문제를 자동으로 생성합니다. React와 Vite 기반으로 모든 브라우저에서 사용 가능합니다.

### Key Highlights

* **AI 기반 문서 분석** - Claude Haiku 4.5를 활용한 고품질 요약 및 분석
* **맞춤형 학습 자료** - 사용자 요구사항에 맞춘 개인화된 요약 및 문제 생성
* **벼락치기 모드** - 시험까지 남은 시간에 맞춰 최적화된 학습 자료 제공
* **대화형 학습** - AI와 대화하며 문서 내용을 심층 학습
* **작업 내역 관리** - 이전 작업물을 언제든지 조회하고 다운로드
* **이메일 인증** - Zoho SMTP 기반 안전한 사용자 인증 시스템
* **세션 관리** - Redis 기반 안전한 세션 관리
* **반응형 웹** - 모든 브라우저에서 접근 가능한 웹 애플리케이션

<div align="center">

### Built With

[![Spring Boot][Spring-badge]][Spring-url]
[![Kotlin][Kotlin-badge]][Kotlin-url]
[![React][React-badge]][React-url]
[![TypeScript][TypeScript-badge]][TypeScript-url]
[![Vite][Vite-badge]][Vite-url]
[![MySQL][MySQL-badge]][MySQL-url]
[![Redis][Redis-badge]][Redis-url]
[![Docker][Docker-badge]][Docker-url]

</div>

## Features

### 📝 문서 요약

<div align="center">
  <img src="https://imagedelivery.net/R9FsTLXBX6-6fZLUqzGBBg/c2fafe7f-78cc-4069-e856-ef3f3cae2600/public" alt="Summary Feature" width="700">
</div>

PDF 교육 자료를 업로드하면 Claude AI가 핵심 내용을 체계적으로 정리하여 학습 가이드를 생성합니다.

- 마크다운 형식으로 구조화된 요약 제공
- 중요 개념, 예시, 세부사항 포함
- 학습 목표에 맞춘 맞춤형 요약
- 최대 100페이지, 30MB까지 지원

### 📋 예상 문제 생성

<div align="center">
  <img src="https://imagedelivery.net/R9FsTLXBX6-6fZLUqzGBBg/d7ae62d8-6050-4af0-3f89-0dab090dab00/public" alt="Quiz Feature" width="700">
</div>

업로드한 자료를 기반으로 시험 대비 예상 문제를 자동 생성합니다.

- 다양한 유형의 문제 (객관식 15-20문제, 주관식 10-12문제, 논술형 4-6문제)
- 모든 문제에 상세한 해설 및 정답 포함
- Bloom's taxonomy 기반 난이도 설계
- 학습 내용에 대한 이해도 체크

### ⚡ 벼락치기 모드

<div align="center">
  <img src="https://imagedelivery.net/R9FsTLXBX6-6fZLUqzGBBg/7b044ab4-faaa-4b86-7444-2d5c4a713a00/public" alt="Cramming Feature" width="700">
</div>

시험까지 남은 시간을 고려한 맞춤형 학습 자료 생성

- 시험까지 남은 시간 입력 (시간 단위)
- 시간에 따른 우선순위 학습 내용 제공
- 핵심 개념 위주의 빠른 학습 가이드
- 최소 시간으로 최대 효과

### 💬 대화형 학습

<div align="center">
  <img src="https://imagedelivery.net/R9FsTLXBX6-6fZLUqzGBBg/d725584b-420f-40b9-a8b3-4333f431f700/public" alt="Chat Feature" width="700">
</div>

AI와 대화하며 문서 내용을 더 깊이 이해

- 업로드한 문서 기반 질의응답
- 개념 설명 및 추가 예시 제공
- 실시간 스트리밍 응답
- 학습 과정 맞춤형 대화

### 📚 작업 내역 관리

<div align="center">
  <img src="https://imagedelivery.net/R9FsTLXBX6-6fZLUqzGBBg/c91f6d08-5bc5-44e9-d78b-1d56462b8a00/public" alt="History Feature" width="700">
</div>

- 이전에 생성한 요약 및 문제 확인
- 언제든지 다시 다운로드 가능
- 처리 유형별 필터링 지원
- 페이지네이션으로 효율적인 탐색

## Tech Stack

<details>
<summary><b>Backend</b></summary>

| Category | Technology |
|----------|-----------|
| Framework | Spring Boot 3.2.0 |
| Language | Kotlin 1.9.21 |
| Database | MySQL 8.0 |
| Cache | Redis 7 |
| ORM | Spring Data JPA |
| Migration | Flyway (6 migrations) |
| Security | Spring Security + JWT |
| AI Integration | Claude API (Haiku 4.5) |
| Email Service | Zoho SMTP |
| PDF Processing | Apache PDFBox 2.0.30 |
| PDF Generation | OpenHTMLToPDF 1.0.10 |
| Markdown | Flexmark 0.64.8 |
| HTTP Client | OkHttp3 4.12.0 |
| Async | Kotlin Coroutines |
| Testing | JUnit 5, MockK, Testcontainers |

</details>

<details>
<summary><b>Frontend Application (Web)</b></summary>

| Category | Technology |
|----------|-----------|
| UI Library | React 19.1.1 |
| Language | TypeScript 5.9.3 |
| Bundler | Vite 7.1.7 |
| PDF Rendering | PDF.js 5.4.296 |
| OCR | Tesseract.js 6.0.1 |
| Emoji | Twemoji 14.0.2 |
| Linting | ESLint 9.36.0 |

</details>

<details>
<summary><b>Infrastructure</b></summary>

| Category | Technology |
|----------|-----------|
| Container | Docker & Docker Compose |
| Build Tool | Gradle (Kotlin DSL) |
| Code Quality | Ktlint |

</details>

## Architecture

### System Overview
```
┌─────────────────────────────────────────┐
│         Web Browser (React + Vite)      │
│                                         │
│  ┌─────────────┐     ┌──────────────┐  │
│  │   Backend   │     │   ChatGPT    │  │
│  │     API     │     │     API      │  │
│  └──────┬──────┘     └──────────────┘  │
└─────────┼──────────────────────────────┘
          │ HTTP/REST
          ▼
┌─────────────────┐      ┌──────────────┐
│  Spring Boot    │─────▶│  Claude API  │
│    Backend      │      │  (Haiku 4.5) │
└────────┬────────┘      └──────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│ MySQL  │ │ Redis  │
└────────┘ └────────┘
```

### Project Structure

```
ai-professor/
├── backend/                      # Spring Boot Backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── kotlin/com/aiprofessor/
│   │   │   │   ├── application/    # Application Service Layer
│   │   │   │   │   ├── auth/       # Authentication services
│   │   │   │   │   └── document/   # Document processing
│   │   │   │   ├── domain/         # Domain Models & Entities
│   │   │   │   │   ├── document/   # DocumentHistory, Request/Response
│   │   │   │   │   ├── user/       # User entity
│   │   │   │   │   └── session/    # UserSession entity
│   │   │   │   ├── infrastructure/ # External System Integration
│   │   │   │   │   ├── claude/     # Claude API client
│   │   │   │   │   ├── email/      # Zoho email service
│   │   │   │   │   ├── security/   # JWT filters
│   │   │   │   │   └── util/       # PDF utils, File storage
│   │   │   │   └── presentation/   # REST API Controllers
│   │   │   │       ├── auth/       # AuthController
│   │   │   │       └── document/   # DocumentController
│   │   │   └── resources/
│   │   │       ├── db/migration/   # Flyway migrations (V1-V6)
│   │   │       ├── prompts/        # AI Prompt Templates
│   │   │       │   ├── summary.md
│   │   │       │   ├── exam-questions.md
│   │   │       │   └── cramming.md
│   │   │       └── application.yml # Multi-profile config
│   │   └── test/
│   ├── build.gradle.kts
│   ├── docker-compose.yml
│   └── Dockerfile
│
└── frontend/                     # React Web Application
    ├── src/                      # React Components
    │   ├── App.tsx               # Main routing
    │   ├── MainScreen.tsx        # Tab interface
    │   ├── LandingPage.tsx       # Landing page
    │   ├── apiClient.ts          # Backend API client
    │   ├── components/
    │   │   ├── PdfViewer.tsx
    │   │   ├── CrammingTab.tsx
    │   │   └── UserProfileModal.tsx
    │   └── utils/
    │       ├── pdfUtils.ts
    │       └── chatgptClient.ts
    ├── public/                   # Static assets
    ├── package.json
    ├── vite.config.ts            # Vite configuration
    ├── tsconfig.json
    └── index.html
```

### Data Flow

```
1. User Input
   └─▶ Browser: PDF Upload + User Prompt

2. API Request
   └─▶ Backend: Base64 Encoded PDF via REST API

3. AI Processing
   └─▶ Claude API: Document Analysis

4. Response Generation
   └─▶ Backend: Markdown to PDF Conversion

5. Result Delivery
   └─▶ Browser: Auto Download PDF
```

### Technical Highlights

#### 🤖 Claude API Integration
- **Claude Haiku 4.5** - 빠르고 비용 효율적인 AI 모델
- **Custom Prompts** - 교육 목적에 최적화된 프롬프트 시스템 (3가지: 요약/시험/벼락치기)
- **Async Processing** - 코루틴 기반 비동기 처리 (최대 64,000 토큰)
- **Token Management** - 섹션별 토큰 제한으로 안정적인 응답
- **Long Timeout** - 10분 타임아웃으로 대용량 PDF 처리
- **Streaming Support** - 실시간 스트리밍 응답 (대화형 모드)

#### ⚡ Performance
- **Pagination** - 효율적인 대용량 데이터 처리
- **File Storage** - Base64 대신 파일 시스템 저장으로 DB 부하 감소
- **Database Indexing** - 최적화된 쿼리 성능

#### 📄 PDF Processing
- **Validation** - 파일 크기, 페이지 수 검증 (최대 100페이지, 30MB)
- **Multi-file Support** - 여러 파일 동시 업로드 및 처리
- **Parsing** - Apache PDFBox로 PDF 텍스트 추출
- **Conversion** - OpenHTMLToPDF로 Markdown → PDF 변환
- **Flexmark** - 마크다운 렌더링 최적화

#### 🔒 Security & Auth
- **JWT Authentication** - 24시간 유효 토큰 기반 인증
- **Email Verification** - Zoho SMTP를 통한 이메일 인증
- **Session Management** - Redis 기반 세션 관리 (단일 세션)
- **Device Tracking** - MAC 주소 및 IP 기반 디바이스 추적
- **CORS Policy** - 환경별 CORS 설정 (개발/운영)
- **BCrypt Hashing** - 안전한 비밀번호 암호화


## Roadmap

### Completed Features ✅
- [x] 문서 요약 생성 (Summary)
- [x] 예상 문제 생성 (Exam Questions)
- [x] 벼락치기 모드 (Cramming)
- [x] 대화형 학습 (Chat)
- [x] 이메일 인증 시스템
- [x] 작업 내역 관리
- [x] 멀티파일 업로드
- [x] Redis 세션 관리
- [x] 파일 시스템 저장

### Planned Features 📋
- [ ] 다국어 지원 (영어, 일본어)
- [ ] 플래시카드 생성 기능
- [ ] PDF 하이라이트 및 주석
- [ ] 음성 요약 (TTS)
- [ ] 모바일 반응형 UI 개선
- [ ] PWA (Progressive Web App) 지원
- [ ] 협업 기능 (팀 학습)
- [ ] 학습 진도 추적 및 통계

---

<div align="center">

Made with ❤️ for better learning

</div>

<!-- Badges -->
[Spring-badge]: https://img.shields.io/badge/Spring%20Boot-6DB33F?style=for-the-badge&logo=spring&logoColor=white
[Spring-url]: https://spring.io/projects/spring-boot
[Kotlin-badge]: https://img.shields.io/badge/Kotlin-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white
[Kotlin-url]: https://kotlinlang.org/
[React-badge]: https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black
[React-url]: https://reactjs.org/
[TypeScript-badge]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[Vite-badge]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
[Vite-url]: https://vitejs.dev/
[MySQL-badge]: https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white
[MySQL-url]: https://www.mysql.com/
[Redis-badge]: https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white
[Redis-url]: https://redis.io/
[Docker-badge]: https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white
[Docker-url]: https://www.docker.com/
