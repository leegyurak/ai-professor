<div align="center">

<!-- 프로젝트 로고 -->
<img src="docs/images/logo.png" alt="Logo" width="120" height="120">

# AI Professor

### AI 기반 교육 자료 요약 및 문제 생성 플랫폼

교육 자료 PDF를 업로드하면 AI가 자동으로 핵심 내용을 요약하고 예상 문제를 생성해주는 데스크톱 애플리케이션

[Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [Architecture](#architecture) • [API](#api)

<!-- 프로젝트 스크린샷 -->
<img src="docs/images/screenshot-main.png" alt="Screenshot" width="800">

</div>

---

## About The Project

<!-- 데모 GIF 또는 비디오 -->
<div align="center">
  <img src="docs/images/demo.gif" alt="Demo" width="600">
</div>

<br>

AI Professor는 학생들의 효율적인 학습을 돕기 위해 개발된 데스크톱 애플리케이션입니다. Claude AI의 강력한 문서 분석 능력을 활용하여 복잡한 교육 자료를 명확하고 체계적인 요약본으로 변환하고, 학습 내용을 점검할 수 있는 예상 문제를 자동으로 생성합니다.

### Key Highlights

* **AI 기반 문서 분석** - Claude AI의 Document Vision API를 활용한 고품질 요약
* **맞춤형 학습 자료** - 사용자 요구사항에 맞춘 개인화된 요약 및 문제 생성
* **작업 내역 관리** - 이전 작업물을 언제든지 조회하고 다운로드
* **크로스 플랫폼** - Electron 기반 데스크톱 앱으로 다양한 OS 지원

<div align="center">

### Built With

[![Spring Boot][Spring-badge]][Spring-url]
[![Kotlin][Kotlin-badge]][Kotlin-url]
[![Electron][Electron-badge]][Electron-url]
[![MySQL][MySQL-badge]][MySQL-url]
[![Redis][Redis-badge]][Redis-url]
[![Docker][Docker-badge]][Docker-url]

</div>

## Features

### 📝 문서 요약

<div align="center">
  <img src="docs/images/feature-summary.png" alt="Summary Feature" width="700">
</div>

PDF 교육 자료를 업로드하면 Claude AI가 핵심 내용을 체계적으로 정리하여 학습 가이드를 생성합니다.

- 마크다운 형식으로 구조화된 요약 제공
- 중요 개념, 예시, 세부사항 포함
- 학습 목표에 맞춘 맞춤형 요약
- 최대 100페이지, 30MB까지 지원

### 📋 예상 문제 생성

<div align="center">
  <img src="docs/images/feature-quiz.png" alt="Quiz Feature" width="700">
</div>

업로드한 자료를 기반으로 시험 대비 예상 문제를 자동 생성합니다.

- 다양한 유형의 문제 (객관식, 주관식, 논술형)
- 해설 및 정답 포함
- 학습 내용에 대한 이해도 체크

### 📚 작업 내역 관리

<div align="center">
  <img src="docs/images/feature-history.png" alt="History Feature" width="700">
</div>

- 이전에 생성한 요약 및 문제 확인
- 언제든지 다시 다운로드 가능
- 처리 유형별 필터링 지원
- 페이지네이션으로 효율적인 탐색

### 🔐 사용자 인증

<div align="center">
  <img src="docs/images/feature-auth.png" alt="Auth Feature" width="700">
</div>

- JWT 기반 보안 인증
- 개인별 작업 내역 관리
- Redis 기반 세션 관리

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
| Migration | Flyway |
| Security | Spring Security + JWT |
| AI Integration | Claude API (Anthropic) |
| PDF Processing | Apache PDFBox, OpenHTMLToPDF |
| HTTP Client | OkHttp3 |
| Testing | JUnit 5, MockK, Testcontainers |

</details>

<details>
<summary><b>Desktop Application</b></summary>

| Category | Technology |
|----------|-----------|
| Framework | Electron 30 |
| UI Library | React 18 |
| Language | TypeScript 5 |
| Bundler | Vite 5 |
| PDF Rendering | PDF.js |

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

<!-- 아키텍처 다이어그램 이미지 -->
<div align="center">
  <img src="docs/images/architecture.png" alt="Architecture Diagram" width="800">
</div>

<br>

```
┌─────────────────┐
│  Desktop App    │
│   (Electron)    │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐      ┌──────────────┐
│  Spring Boot    │─────▶│  Claude API  │
│    Backend      │      └──────────────┘
└────────┬────────┘
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
│   │   │   │   ├── domain/         # Domain Models & Business Logic
│   │   │   │   ├── infrastructure/ # External System Integration
│   │   │   │   └── presentation/   # REST API Controllers
│   │   │   └── resources/
│   │   │       ├── prompts/        # AI Prompt Templates
│   │   │       └── application.yml
│   │   └── test/
│   ├── build.gradle.kts
│   └── docker-compose.yml
│
└── desktop/                      # Electron Desktop App
    ├── electron/                 # Main Process
    ├── src/                      # Renderer Process (React)
    ├── package.json
    └── vite.renderer.config.ts
```

### Data Flow

```
1. User Input
   └─▶ Desktop: PDF Upload + User Prompt

2. API Request
   └─▶ Backend: Base64 Encoded PDF

3. AI Processing
   └─▶ Claude API: Document Analysis

4. Response Generation
   └─▶ Backend: Markdown to PDF Conversion

5. Result Delivery
   └─▶ Desktop: Auto Download PDF
```

### Technical Highlights

#### 🤖 Claude API Integration
- **Document Vision API** - PDF 직접 분석 (이미지 변환 불필요)
- **Custom Prompts** - 교육 목적에 최적화된 프롬프트 시스템
- **Async Processing** - 코루틴 기반 비동기 처리 (최대 60,000 토큰)
- **Token Management** - 섹션별 토큰 제한으로 안정적인 응답

#### ⚡ Caching Strategy
- **Redis Cache** - 작업 내역 캐싱으로 조회 성능 향상
- **Smart Invalidation** - 새 작업 생성 시 자동 캐시 무효화
- **Pagination** - 효율적인 대용량 데이터 처리

#### 📄 PDF Processing
- **Validation** - 파일 크기, 페이지 수 검증 (최대 100페이지, 30MB)
- **Parsing** - Apache PDFBox로 PDF 추출
- **Conversion** - OpenHTMLToPDF로 Markdown → PDF 변환
- **Flexmark** - 마크다운 렌더링 최적화

## Getting Started

### Prerequisites

- **Docker & Docker Compose** - 컨테이너 실행 환경
- **Node.js** 18 이상
- **Java** 17 이상
- **Gradle** 8 이상

### Installation

#### 1️⃣ Clone the repository

```bash
git clone https://github.com/yourusername/ai-professor.git
cd ai-professor
```

#### 2️⃣ Backend Setup

```bash
cd backend
```

Create `.env` file:
```env
JWT_SECRET=your-secret-key-here-minimum-32-characters
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxxx
```

Start services with Docker Compose:
```bash
docker-compose up -d
```

This will start:
- MySQL 8.0 on port `3306`
- Redis 7 on port `6379`
- Backend API on port `8080`

#### 3️⃣ Desktop App Setup

```bash
cd ../desktop
npm install
```

Create `.env` file:
```env
VITE_API_BASE_URL=http://localhost:8080
```

Start the app:
```bash
# Terminal 1: Start renderer dev server
npm run dev

# Terminal 2: Start Electron
npm run electron
```

### Building for Production

#### Backend
```bash
cd backend
./gradlew build
docker build -t ai-professor-backend .
```

#### Desktop App
```bash
cd desktop
npm run build
npm run package:mac  # macOS (Apple Silicon)
```

## API

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "user",
  "password": "pass"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

### Document Processing

#### Generate Summary
```http
POST /api/documents/summary
Authorization: Bearer {token}
Content-Type: application/json

{
  "pdfBase64": "base64_encoded_pdf",
  "userPrompt": "이 자료의 핵심 내용을 3페이지로 요약해주세요"
}
```

#### Generate Exam Questions
```http
POST /api/documents/exam-questions
Authorization: Bearer {token}
Content-Type: application/json

{
  "pdfBase64": "base64_encoded_pdf",
  "userPrompt": "객관식 20문제를 만들어주세요"
}
```

#### Get History
```http
GET /api/documents/history?page=0&size=20&processingType=SUMMARY
Authorization: Bearer {token}
```

## Development

### Running Tests

```bash
cd backend
./gradlew test
```

### Code Formatting

```bash
./gradlew ktlintFormat
```

### Development Mode

Backend with hot reload:
```bash
./gradlew bootRun
```

Desktop with hot reload:
```bash
npm run dev  # Vite dev server
```

## Roadmap

- [ ] 다국어 지원 (영어, 일본어)
- [ ] 플래시카드 생성 기능
- [ ] PDF 하이라이트 기능
- [ ] 음성 요약 (TTS)
- [ ] 모바일 앱 (React Native)

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
[Electron-badge]: https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white
[Electron-url]: https://www.electronjs.org/
[MySQL-badge]: https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white
[MySQL-url]: https://www.mysql.com/
[Redis-badge]: https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white
[Redis-url]: https://redis.io/
[Docker-badge]: https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white
[Docker-url]: https://www.docker.com/
