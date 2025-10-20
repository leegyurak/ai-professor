import { useEffect, useRef, useState } from 'react';

interface Feature {
  emoji: string;
  title: string;
  desc: string;
  badge: string | null;
  detailedDesc: string;
  demoGifUrl: string | string[];
  gifDurations?: number[]; // milliseconds for each GIF
}

export function LandingPage({ onNavigateToLogin }: { onNavigateToLogin: () => void }) {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [currentGifIndex, setCurrentGifIndex] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const gifContainerRef = useRef<HTMLDivElement>(null);
  const gifTimerRef = useRef<number | null>(null);

  // Reset GIF index when modal opens and cleanup timer
  useEffect(() => {
    if (selectedFeature) {
      setCurrentGifIndex(0);
    } else {
      // Clear timer when modal closes
      if (gifTimerRef.current !== null) {
        clearTimeout(gifTimerRef.current);
        gifTimerRef.current = null;
      }
    }
  }, [selectedFeature]);

  // Auto-advance GIF when currentGifIndex changes
  useEffect(() => {
    // Clear existing timer
    if (gifTimerRef.current !== null) {
      clearTimeout(gifTimerRef.current);
      gifTimerRef.current = null;
    }

    // Only set timer if modal is open and feature has multiple GIFs
    if (selectedFeature) {
      const urls = Array.isArray(selectedFeature.demoGifUrl) ? selectedFeature.demoGifUrl : [selectedFeature.demoGifUrl];

      if (urls.length > 1) {
        const duration = selectedFeature.gifDurations?.[currentGifIndex] || 5000;
        console.log(`[GIF useEffect] Setting timer for ${duration}ms at index ${currentGifIndex}`);

        gifTimerRef.current = window.setTimeout(() => {
          console.log(`[GIF useEffect] Timer fired, switching from index ${currentGifIndex}`);
          setCurrentGifIndex((prev) => {
            const next = prev + 1;
            const newIndex = next >= urls.length ? 0 : next;
            console.log(`[GIF useEffect] Moving to index ${newIndex}`);
            return newIndex;
          });
          gifTimerRef.current = null;
        }, duration);
      }
    }

    // Cleanup function
    return () => {
      if (gifTimerRef.current !== null) {
        clearTimeout(gifTimerRef.current);
        gifTimerRef.current = null;
      }
    };
  }, [selectedFeature, currentGifIndex]);

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);

    // Intersection Observer for scroll animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe all sections
    const sections = document.querySelectorAll('[data-animate]');
    sections.forEach((section) => {
      if (observerRef.current) {
        observerRef.current.observe(section);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const features: Feature[] = [
    {
      emoji: '📚',
      title: 'PDF 자료 업로드',
      desc: '강의 자료, 교재, 논문 등\n학습 자료를 업로드하세요',
      badge: null,
      detailedDesc: 'PDF 파일을 드래그 앤 드롭하거나 클릭하여 업로드하세요.\n\n강의 자료, 교재, 논문, 학습 노트 등 다양한 형식의 PDF를 지원합니다.\n\n업로드된 파일은 안전하게 저장됩니다.',
      demoGifUrl: '/demo/upload.gif'
    },
    {
      emoji: '✨',
      title: 'AI 자동 요약',
      desc: '핵심 내용만 빠르게 파악하고\n시간을 절약하세요',
      badge: '무제한 무료',
      detailedDesc: 'AI가 PDF 내용을 분석하여 핵심만 추려 요약해드립니다.\n\n긴 강의 자료도 몇 분 안에 핵심 포인트를 파악할 수 있고, 꼭 필요한 내용은 하이라이팅으로 AI가 이해할 수 있습니다.\n\n중요한 개념, 키워드, 정의가 자동으로 정리되며 결과를 언제든 다시 다운로드할 수 있습니다.',
      demoGifUrl: '/demo/summary.gif'
    },
    {
      emoji: '📝',
      title: '문제 자동 생성',
      desc: '시험 대비 예상 문제를\nAI가 자동으로 만들어줍니다',
      badge: '무제한 무료',
      detailedDesc: 'AI가 학습 자료를 기반으로 예상 문제를 자동 생성합니다.\n\n꼭 출제되어야 할 내용은 하이라이팅으로 AI가 이해할 수 있습니다. 객관식, 단답형, 서술형 등 다양한 유형의 문제가 제공되며, 실제 시험과 유사한 난이도로 출제됩니다.\n\n문제 풀이 후 즉시 정답과 해설을 확인할 수 있어 효과적인 학습이 가능합니다.',
      demoGifUrl: '/demo/questions.gif'
    },
    {
      emoji: '⚡',
      title: '벼락치기 모드',
      desc: '시험 전날 빠른 복습을 위한\n압축 요약 제공',
      badge: '무제한 무료',
      detailedDesc: '시험 직전 빠른 복습을 위한 초압축 요약 모드입니다.\n\n핵심 개념과 중요 포인트만 빠르게 훑어볼 수 있도록 정리되며, 스피드 퀴즈를 통해 확실히 암기할 수 있습니다.\n\n시험 전날 밤이나 시험 직전 몇 분 안에 전체 내용을 리마인드할 수 있습니다.',
      demoGifUrl: ['/demo/cramming1.gif', '/demo/cramming2.gif'],
      gifDurations: [4000, 7000] // 4초, 7초
    }
  ];

  const steps = [
    { emoji: '📤', text: 'PDF 강의 자료 업로드' },
    { emoji: '⚡', text: 'AI가 자동으로 핵심 요약' },
    { emoji: '📝', text: '예상 문제 확인하고 공부' },
    { emoji: '🎉', text: '시험 A+ 받기!' }
  ];


  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--panel)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'clamp(8px, 2.5vw, 10px) clamp(10px, 3vw, 12px)', gap: 'clamp(8px, 2vw, 12px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px, 1.5vw, 6px)', minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 'clamp(18px, 5vw, 20px)', flexShrink: 0 }}>🎓</div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <h1 className="title" style={{ fontSize: 'clamp(14px, 4vw, 16px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>AI Professor</h1>
              <div className="small" style={{ color: 'var(--muted)', marginTop: 1, fontSize: 'clamp(10px, 2.5vw, 11px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>대학생을 위한 AI 학습 도우미</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2.5vw, 12px)', flexShrink: 0 }}>
            <button
              onClick={onNavigateToLogin}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 'clamp(10px, 2.5vw, 11px)',
                fontFamily: 'inherit',
                padding: 'clamp(4px, 1.5vw, 5px) clamp(6px, 2vw, 8px)',
                transition: 'color 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              🚀 로그인
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }

        .animate-scaleIn {
          animation: scaleIn 0.5s ease-out forwards;
        }

        .animate-delay-1 {
          animation-delay: 0.1s;
        }

        .animate-delay-2 {
          animation-delay: 0.2s;
        }

        .animate-delay-3 {
          animation-delay: 0.3s;
        }

        .animate-delay-4 {
          animation-delay: 0.4s;
        }

        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px var(--shadow-md);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: clamp(16px, 3vw, 24px);
        }

        @media (max-width: 768px) {
          .features-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (min-width: 1024px) {
          .features-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>

      {/* Hero Section */}
      <section style={{
        padding: 'clamp(60px, 10vh, 100px) clamp(20px, 5vw, 32px) clamp(80px, 12vh, 120px)',
        textAlign: 'center',
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Notebook horizontal lines */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(200,200,220,0.3) 31px, rgba(200,200,220,0.3) 32px)',
          pointerEvents: 'none'
        }} />

        {/* Notebook margin line - red/pink vertical line on left */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 'clamp(60px, 8vw, 100px)',
          bottom: 0,
          width: '2px',
          background: 'rgba(255,100,120,0.15)',
          pointerEvents: 'none'
        }} />

        {/* Highlight accent bars - like highlighter marks */}
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '5%',
          width: '120px',
          height: '4px',
          background: 'rgba(0,0,0,0.06)',
          borderRadius: '2px',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          top: '22%',
          right: '8%',
          width: '80px',
          height: '4px',
          background: 'rgba(0,0,0,0.04)',
          borderRadius: '2px',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '25%',
          left: '6%',
          width: '100px',
          height: '4px',
          background: 'rgba(0,0,0,0.05)',
          borderRadius: '2px',
          pointerEvents: 'none'
        }} />

        {/* Decorative corner fold effect - top right */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderWidth: '0 80px 80px 0',
          borderColor: 'transparent rgba(0,0,0,0.02) transparent transparent',
          pointerEvents: 'none'
        }} />

        {/* Subtle gradient overlay for depth */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.01) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />

        {/* Notebook punch holes at top */}
        <div style={{
          position: 'absolute',
          top: '40px',
          left: 'clamp(20px, 3vw, 30px)',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.08)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          top: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.08)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          top: '40px',
          right: 'clamp(20px, 3vw, 30px)',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.08)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div
            className="animate-fadeIn"
            style={{
              display: 'inline-block',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              padding: '8px 20px',
              borderRadius: 20,
              fontSize: 'clamp(12px, 2.5vw, 13px)',
              fontWeight: 600,
              marginBottom: 'clamp(24px, 4vh, 32px)',
              color: 'var(--text-secondary)',
              opacity: 0,
              position: 'relative'
            }}
          >
            ✨ 대학생 필수 학습 도구
          </div>

          {/* Emoji Icon */}
          <div
            className="animate-scaleIn"
            style={{
              fontSize: 'clamp(64px, 15vw, 96px)',
              marginBottom: 'clamp(16px, 3vh, 24px)',
              opacity: 0,
              animationDelay: '0.2s',
              position: 'relative'
            }}
          >
            🎓
          </div>

          {/* Main Title */}
          <h1
            className="animate-fadeInUp"
            style={{
              fontSize: 'clamp(32px, 8vw, 56px)',
              fontWeight: 700,
              marginBottom: 'clamp(16px, 3vh, 24px)',
              lineHeight: 1.2,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
              opacity: 0,
              animationDelay: '0.4s',
              position: 'relative'
            }}
          >
            시험 기간,<br />
            AI Professor와 함께<br />
            A+ 받자
          </h1>

          {/* Subtitle */}
          <p
            className="animate-fadeInUp"
            style={{
              fontSize: 'clamp(16px, 3.5vw, 18px)',
              marginBottom: 'clamp(40px, 6vh, 56px)',
              color: 'var(--muted)',
              lineHeight: 1.6,
              maxWidth: 600,
              margin: '0 auto clamp(40px, 6vh, 56px)',
              opacity: 0,
              animationDelay: '0.6s',
              position: 'relative'
            }}
          >
            PDF 업로드만 하면 AI가 핵심 요약 + 예상 문제까지<br />
            <strong style={{ color: 'var(--text)' }}>시험 완벽 정복</strong>
          </p>

          {/* CTA Buttons */}
          <div
            className="animate-fadeInUp"
            style={{
              display: 'flex',
              gap: 'clamp(12px, 3vw, 16px)',
              justifyContent: 'center',
              flexWrap: 'wrap',
              opacity: 0,
              animationDelay: '0.8s',
              position: 'relative'
            }}
          >
            <button
              onClick={onNavigateToLogin}
              className="btn"
              style={{
                padding: 'clamp(14px, 3vw, 16px) clamp(32px, 6vw, 40px)',
                fontSize: 'clamp(15px, 3.5vw, 16px)',
                fontWeight: 600
              }}
            >
              🚀 무료로 시작하기
            </button>
            <button
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn secondary"
              style={{
                padding: 'clamp(14px, 3vw, 16px) clamp(32px, 6vw, 40px)',
                fontSize: 'clamp(15px, 3.5vw, 16px)',
                fontWeight: 600
              }}
            >
              💡 어떻게 사용하나요?
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        data-animate
        style={{
          padding: 'clamp(60px, 10vh, 100px) clamp(20px, 5vw, 32px)',
          maxWidth: 1200,
          margin: '0 auto'
        }}
      >
        <div
          className={visibleSections.has('features') ? 'animate-fadeInUp' : ''}
          style={{
            textAlign: 'center',
            marginBottom: 'clamp(48px, 8vh, 64px)',
            opacity: visibleSections.has('features') ? 1 : 0
          }}
        >
          <h2 style={{
            fontSize: 'clamp(28px, 6vw, 40px)',
            fontWeight: 700,
            marginBottom: 'clamp(12px, 2vh, 16px)',
            color: 'var(--text)',
            letterSpacing: '-0.02em'
          }}>
            이런 기능들이 있어요 ✨
          </h2>
          <p style={{
            fontSize: 'clamp(14px, 3vw, 16px)',
            color: 'var(--muted)'
          }}>
            시험 준비부터 복습까지, AI Professor가 함께합니다
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedFeature(feature)}
              className={`card hover-lift ${visibleSections.has('features') ? `animate-fadeInUp animate-delay-${idx + 1}` : ''}`}
              style={{
                textAlign: 'center',
                padding: 'clamp(28px, 5vw, 36px)',
                cursor: 'pointer',
                opacity: visibleSections.has('features') ? 1 : 0,
                position: 'relative'
              }}
            >
              {feature.badge && (
                <div style={{
                  position: 'absolute',
                  top: 'clamp(12px, 3vw, 16px)',
                  right: 'clamp(12px, 3vw, 16px)',
                  background: 'var(--accent)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontSize: 'clamp(10px, 2.3vw, 11px)',
                  fontWeight: 700
                }}>
                  {feature.badge}
                </div>
              )}
              <div
                style={{
                  fontSize: 'clamp(48px, 10vw, 56px)',
                  marginBottom: 'clamp(16px, 3vh, 20px)'
                }}
              >
                {feature.emoji}
              </div>
              <h3 style={{
                fontSize: 'clamp(17px, 4vw, 18px)',
                fontWeight: 600,
                marginBottom: 'clamp(8px, 2vh, 12px)',
                color: 'var(--text)'
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontSize: 'clamp(13px, 3vw, 14px)',
                color: 'var(--muted)',
                lineHeight: 1.6,
                whiteSpace: 'pre-line'
              }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        data-animate
        style={{
          padding: 'clamp(60px, 10vh, 100px) clamp(20px, 5vw, 32px)',
          background: 'var(--bg)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)'
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2
            className={visibleSections.has('how-it-works') ? 'animate-fadeInUp' : ''}
            style={{
              fontSize: 'clamp(28px, 6vw, 40px)',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: 'clamp(48px, 8vh, 64px)',
              color: 'var(--text)',
              letterSpacing: '-0.02em',
              opacity: visibleSections.has('how-it-works') ? 1 : 0
            }}
          >
            사용법은 정말 간단해요 🎯
          </h2>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(16px, 3vh, 20px)'
          }}>
            {steps.map((item, idx) => (
              <div
                key={idx}
                className={`card ${visibleSections.has('how-it-works') ? `animate-fadeInUp animate-delay-${idx + 1}` : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(16px, 4vw, 24px)',
                  padding: 'clamp(20px, 4vw, 28px)',
                  opacity: visibleSections.has('how-it-works') ? 1 : 0
                }}
              >
                <div style={{
                  width: 'clamp(48px, 10vw, 56px)',
                  height: 'clamp(48px, 10vw, 56px)',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'clamp(18px, 4vw, 20px)',
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  {idx + 1}
                </div>
                <div
                  style={{
                    fontSize: 'clamp(32px, 7vw, 40px)',
                    flexShrink: 0
                  }}
                >
                  {item.emoji}
                </div>
                <div style={{
                  fontSize: 'clamp(15px, 3.5vw, 17px)',
                  fontWeight: 500,
                  color: 'var(--text)'
                }}>
                  {item.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        id="final-cta"
        data-animate
        style={{
          padding: 'clamp(80px, 12vh, 120px) clamp(20px, 5vw, 32px)',
          textAlign: 'center',
          background: 'var(--bg)',
          borderTop: '1px solid var(--border)'
        }}
      >
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div
            className={visibleSections.has('final-cta') ? 'animate-scaleIn' : ''}
            style={{
              fontSize: 'clamp(56px, 12vw, 72px)',
              marginBottom: 'clamp(24px, 4vh, 32px)',
              opacity: visibleSections.has('final-cta') ? 1 : 0
            }}
          >
            🎓
          </div>
          <h2
            className={visibleSections.has('final-cta') ? 'animate-fadeInUp' : ''}
            style={{
              fontSize: 'clamp(28px, 6vw, 40px)',
              fontWeight: 700,
              marginBottom: 'clamp(32px, 6vh, 40px)',
              lineHeight: 1.3,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
              opacity: visibleSections.has('final-cta') ? 1 : 0,
              animationDelay: '0.2s'
            }}
          >
            지금 바로 시작하고<br />
            다음 시험에서 A+ 받으세요!
          </h2>
          <button
            onClick={onNavigateToLogin}
            className={`btn ${visibleSections.has('final-cta') ? 'animate-scaleIn' : ''}`}
            style={{
              padding: 'clamp(16px, 3.5vw, 18px) clamp(40px, 8vw, 56px)',
              fontSize: 'clamp(16px, 3.5vw, 18px)',
              fontWeight: 600,
              opacity: visibleSections.has('final-cta') ? 1 : 0,
              animationDelay: '0.4s'
            }}
          >
            🚀 무료로 시작하기
          </button>
          <div
            className={visibleSections.has('final-cta') ? 'animate-fadeIn' : ''}
            style={{
              marginTop: 'clamp(24px, 5vh, 32px)',
              fontSize: 'clamp(13px, 2.8vw, 14px)',
              color: 'var(--muted)',
              opacity: visibleSections.has('final-cta') ? 1 : 0,
              animationDelay: '0.8s'
            }}
          >
            이미 계정이 있으신가요?{' '}
            <span
              onClick={onNavigateToLogin}
              style={{
                textDecoration: 'underline',
                cursor: 'pointer',
                fontWeight: 600,
                color: 'var(--text-secondary)'
              }}
            >
              로그인하기
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: 'clamp(40px, 6vh, 56px) clamp(20px, 5vw, 32px)',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
        textAlign: 'center',
        fontSize: 'clamp(12px, 2.5vw, 13px)',
        color: 'var(--muted)'
      }}>
        <div style={{ marginBottom: 12 }}>
          <span
            onClick={() => window.location.pathname = '/privacy'}
            style={{
              cursor: 'pointer',
              textDecoration: 'underline',
              marginRight: 16
            }}
          >
            개인정보처리방침
          </span>
          <span>AI Professor © 2025</span>
        </div>
        <div style={{ fontSize: 'clamp(11px, 2.3vw, 12px)' }}>
          대학생을 위한 AI 학습 도우미
        </div>
      </footer>

      {/* Feature Detail Modal */}
      {selectedFeature && (
        <div
          className="overlay"
          onClick={() => {
            setSelectedFeature(null);
            setCurrentGifIndex(0);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'clamp(8px, 2vw, 16px)'
          }}
        >
          <div
            className="card animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 'min(800px, 90vw)',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: 'clamp(24px, 5vw, 40px)',
              position: 'relative',
              textAlign: 'center'
            }}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setSelectedFeature(null);
                setCurrentGifIndex(0);
              }}
              style={{
                position: 'absolute',
                top: 'clamp(12px, 3vw, 16px)',
                right: 'clamp(12px, 3vw, 16px)',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '18px',
                color: 'var(--text-secondary)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)';
                e.currentTarget.style.borderColor = 'var(--text-secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              ✕
            </button>

            {/* Badge */}
            {selectedFeature.badge && (
              <div style={{
                display: 'inline-block',
                background: 'var(--accent)',
                color: 'white',
                padding: '6px 16px',
                borderRadius: 12,
                fontSize: 'clamp(11px, 2.5vw, 12px)',
                fontWeight: 700,
                marginBottom: 'clamp(16px, 3vh, 20px)'
              }}>
                {selectedFeature.badge}
              </div>
            )}

            {/* Emoji */}
            <div style={{
              fontSize: 'clamp(64px, 15vw, 80px)',
              marginBottom: 'clamp(16px, 3vh, 24px)'
            }}>
              {selectedFeature.emoji}
            </div>

            {/* Title */}
            <h2 style={{
              fontSize: 'clamp(24px, 5vw, 32px)',
              fontWeight: 700,
              marginBottom: 'clamp(12px, 2vh, 16px)',
              color: 'var(--text)',
              letterSpacing: '-0.02em'
            }}>
              {selectedFeature.title}
            </h2>

            {/* Demo GIF */}
            <div
              ref={gifContainerRef}
              style={{
                width: '100%',
                maxWidth: '600px',
                margin: '0 auto clamp(24px, 4vh, 32px)',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                position: 'relative',
                aspectRatio: '16 / 9'
              }}
            >
              {(() => {
                const urls = Array.isArray(selectedFeature.demoGifUrl) ? selectedFeature.demoGifUrl : [selectedFeature.demoGifUrl];
                const currentUrl = urls[currentGifIndex];

                return (
                  <>
                    <img
                      key={currentGifIndex}
                      src={currentUrl}
                      alt={`${selectedFeature.title} 시연 ${urls.length > 1 ? `${currentGifIndex + 1}/${urls.length}` : ''}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'block',
                        objectFit: 'cover'
                      }}
                      onLoad={() => {
                        console.log(`[GIF onLoad] Image loaded: ${currentUrl} at index ${currentGifIndex}`);
                      }}
                    />
                    {urls.length > 1 && (
                      <div style={{
                        position: 'absolute',
                        bottom: 'clamp(8px, 2vw, 12px)',
                        right: 'clamp(8px, 2vw, 12px)',
                        background: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: 'clamp(11px, 2.5vw, 12px)',
                        fontWeight: 600
                      }}>
                        {currentGifIndex + 1} / {urls.length}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Detailed description */}
            <p style={{
              fontSize: 'clamp(14px, 3.2vw, 16px)',
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
              textAlign: 'left',
              marginBottom: 'clamp(24px, 4vh, 32px)',
              whiteSpace: 'pre-line'
            }}>
              {selectedFeature.detailedDesc}
            </p>

            {/* CTA Button */}
            <button
              onClick={onNavigateToLogin}
              className="btn"
              style={{
                padding: 'clamp(12px, 3vw, 14px) clamp(24px, 5vw, 32px)',
                fontSize: 'clamp(14px, 3vw, 15px)',
                fontWeight: 600,
                width: '100%',
                maxWidth: '300px'
              }}
            >
              🚀 무료로 시작하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
