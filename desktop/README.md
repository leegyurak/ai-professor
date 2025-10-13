AI Professor Desktop (Electron + TS)

개요
- Electron + TypeScript + React 기반의 데스크톱 앱
- 첫 진입 로그인, 드래그앤드롭 PDF, 30MB 용량 체크, base64 업로드
- 5분 타임아웃, 응답 base64를 PDF로 다운로드, 히스토리 저장

백엔드 연동
- 기본 백엔드 URL: `http://localhost:3000` (src/shared/config.ts)
- 환경변수로 변경: `VITE_BACKEND_URL`
- 엔드포인트 예시:
  - POST /auth/login -> { token, name }
  - POST /api/generate -> body: { type: 'summary'|'quiz', prompt, pdf_base64? } -> { pdf_base64 }

개발 스크립트
- dev: `vite --config vite.renderer.config.ts`
- build: `npm run build` (renderer + electron build)
- start: `electron .`

UI 흐름
1) 로그인 화면: 이메일/비밀번호 입력 -> 성공 시 이름/토큰 저장
2) 메인 화면:
   - 상단: "OOO님 오늘은 어떤 걸 배워볼까요?"
   - 중앙 입력창 + 종이비행기 버튼
   - 하단: "핵심 요약" / "예상 문제 출제" 버튼 2개
   - PDF 드래그앤드롭 영역 (30MB 제한)
   - 요청 중 로딩 인디케이터 (최대 5분)
   - 응답 수신 시 PDF 다운로드 제공
   - 우측: 히스토리(기존 입력/프롬프트/결과) 리스트

보안/파일 접근
- PDF 저장: `window.api.saveBase64Pdf` (Electron IPC)

주의
- 실제 백엔드 엔드포인트 이름/응답 스키마에 맞추어 `src/renderer/apiClient.ts` 수정 필요
- 패키지 설치 후 개발/실행하세요.

