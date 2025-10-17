'use client';

import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 64; // 헤더 높이 (h-14 sm:h-16 평균)
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/10">
      <nav className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="text-lg sm:text-xl md:text-2xl font-bold">
              AI Professor
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-sm lg:text-base hover:opacity-70 transition-opacity"
            >
              기능
            </button>
            <button
              onClick={() => scrollToSection('apply')}
              className="px-4 lg:px-6 py-2 bg-foreground text-background rounded-lg text-sm lg:text-base font-medium hover:opacity-90 transition-opacity"
            >
              신청하기
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-3 sm:py-4 border-t border-foreground/10 animate-in slide-in-from-top">
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => scrollToSection('features')}
                className="text-sm sm:text-base hover:opacity-70 transition-opacity text-left py-2"
              >
                기능
              </button>
              <button
                onClick={() => scrollToSection('apply')}
                className="px-4 py-2.5 sm:py-3 bg-foreground text-background rounded-lg text-sm sm:text-base font-medium w-full hover:opacity-90 transition-opacity"
              >
                신청하기
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
