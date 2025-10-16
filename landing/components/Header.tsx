'use client';

import { useState } from 'react';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/10">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="text-2xl font-bold">
              AI Professor
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm hover:opacity-70 transition-opacity">
              기능
            </a>
            <a href="#testimonials" className="text-sm hover:opacity-70 transition-opacity">
              후기
            </a>
            <a href="https://github.com/yourusername/ai-professor" target="_blank" rel="noopener noreferrer" className="text-sm hover:opacity-70 transition-opacity">
              GitHub
            </a>
            <a href="/docs" className="text-sm hover:opacity-70 transition-opacity">
              문서
            </a>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-3">
            {/* Theme toggle - visible on all screens */}
            <ThemeToggle />

            {/* Desktop CTA */}
            <button className="hidden md:block px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              신청하기
            </button>

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
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
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-foreground/10 animate-in slide-in-from-top">
            <div className="flex flex-col space-y-4">
              <a
                href="#features"
                className="text-sm hover:opacity-70 transition-opacity"
                onClick={() => setIsMenuOpen(false)}
              >
                기능
              </a>
              <a
                href="#testimonials"
                className="text-sm hover:opacity-70 transition-opacity"
                onClick={() => setIsMenuOpen(false)}
              >
                후기
              </a>
              <a
                href="https://github.com/yourusername/ai-professor"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:opacity-70 transition-opacity"
              >
                GitHub
              </a>
              <a
                href="/docs"
                className="text-sm hover:opacity-70 transition-opacity"
                onClick={() => setIsMenuOpen(false)}
              >
                문서
              </a>
              <button className="px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium w-full hover:opacity-90 transition-opacity">
                신청하기
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
