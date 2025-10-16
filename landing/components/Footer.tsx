export default function Footer() {
  return (
    <footer className="border-t border-foreground/10 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">제품</h3>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-sm opacity-70 hover:opacity-100 transition-opacity">
                  기능
                </a>
              </li>
              <li>
                <a href="#testimonials" className="text-sm opacity-70 hover:opacity-100 transition-opacity">
                  사용자 후기
                </a>
              </li>
              <li>
                <a href="#" className="text-sm opacity-70 hover:opacity-100 transition-opacity">
                  릴리즈 노트
                </a>
              </li>
              <li>
                <a href="#" className="text-sm opacity-70 hover:opacity-100 transition-opacity">
                  다운로드
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">리소스</h3>
            <ul className="space-y-2">
              <li>
                <a href="https://github.com/yourusername/ai-professor#readme" target="_blank" rel="noopener noreferrer" className="text-sm opacity-70 hover:opacity-100 transition-opacity">
                  문서
                </a>
              </li>
              <li>
                <a href="https://github.com/yourusername/ai-professor#api" target="_blank" rel="noopener noreferrer" className="text-sm opacity-70 hover:opacity-100 transition-opacity">
                  API 문서
                </a>
              </li>
              <li>
                <a href="https://github.com/yourusername/ai-professor/issues" target="_blank" rel="noopener noreferrer" className="text-sm opacity-70 hover:opacity-100 transition-opacity">
                  이슈 리포트
                </a>
              </li>
              <li>
                <a href="https://github.com/yourusername/ai-professor/discussions" target="_blank" rel="noopener noreferrer" className="text-sm opacity-70 hover:opacity-100 transition-opacity">
                  커뮤니티
                </a>
              </li>
            </ul>
          </div>

          {/* Development */}
          <div>
            <h3 className="font-semibold mb-4">개발</h3>
            <ul className="space-y-2">
              <li>
                <a href="https://github.com/yourusername/ai-professor" target="_blank" rel="noopener noreferrer" className="text-sm opacity-70 hover:opacity-100 transition-opacity">
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://github.com/yourusername/ai-professor#contributing" target="_blank" rel="noopener noreferrer" className="text-sm opacity-70 hover:opacity-100 transition-opacity">
                  기여하기
                </a>
              </li>
              <li>
                <a href="https://github.com/yourusername/ai-professor#roadmap" target="_blank" rel="noopener noreferrer" className="text-sm opacity-70 hover:opacity-100 transition-opacity">
                  로드맵
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">법적 고지</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm opacity-70 hover:opacity-100 transition-opacity">
                  개인정보처리방침
                </a>
              </li>
              <li>
                <a href="#" className="text-sm opacity-70 hover:opacity-100 transition-opacity">
                  이용약관
                </a>
              </li>
              <li>
                <a href="#" className="text-sm opacity-70 hover:opacity-100 transition-opacity">
                  라이선스
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-foreground/10 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm opacity-70">
            © 2024 AI Professor. Made with Claude AI. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="https://github.com/yourusername/ai-professor" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">
              <span className="sr-only">GitHub</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
