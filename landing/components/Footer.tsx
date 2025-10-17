'use client';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-foreground/10 bg-background">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
        {/* Main Content */}
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Logo/Brand */}
          <div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2">AI Professor</h3>
            <p className="text-xs sm:text-sm opacity-70 max-w-md">
              AI 기반 학습 도우미로 공부를 더 쉽고 효율적으로
            </p>
          </div>

          {/* Main Link */}
          <div>
            <a
              href="https://ai-professor.me"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm sm:text-base opacity-70 hover:opacity-100 transition-opacity group"
            >
              <span>서비스 바로가기</span>
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </a>
          </div>

          {/* Legal Links */}
          <div className="text-xs sm:text-sm opacity-60">
            <a href="/privacy" className="hover:opacity-100 transition-opacity">
              개인정보처리방침
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-foreground/10 text-center">
          <p className="text-xs sm:text-sm opacity-60">
            © {currentYear} AI Professor. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
