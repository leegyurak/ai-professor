'use client';

import { motion } from 'framer-motion';

export default function Hero() {
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
    }
  };

  return (
    <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-foreground/20 mb-6 sm:mb-8"
          >
            <span className="text-xs sm:text-sm">
              AI 기반 학습 도우미
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 text-balance max-w-5xl mx-auto leading-tight px-2 sm:px-4"
          >
            공부 자료를{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              요약하고
            </span>{' '}
            <br className="sm:hidden" />
            문제를 만들어드려요
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl opacity-70 mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto text-balance px-2 sm:px-4"
          >
            PDF 파일만 올리면 핵심 내용 정리와{' '}
            <br className="sm:hidden" />
            예상 문제를 자동으로 만들어드립니다
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-10 sm:mb-12 md:mb-16 px-2 sm:px-4"
          >
            <motion.button
              onClick={() => scrollToSection('apply')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-foreground text-background rounded-lg font-medium text-base sm:text-lg hover:opacity-90 transition-opacity w-full sm:w-auto max-w-xs sm:max-w-none"
            >
              지금 신청하기
            </motion.button>
            <motion.button
              onClick={() => scrollToSection('features')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 sm:px-8 py-3 sm:py-4 border border-foreground/20 rounded-lg font-medium text-base sm:text-lg hover:bg-foreground/5 transition-colors w-full sm:w-auto max-w-xs sm:max-w-none"
            >
              자세히 보기
            </motion.button>
          </motion.div>

          {/* Demo/Preview Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative max-w-6xl mx-auto"
          >
            <div className="rounded-2xl overflow-hidden border border-foreground/10 shadow-2xl bg-foreground/5">
              <div className="aspect-video flex items-center justify-center">
                <img
                  src="/hero.gif"
                  alt="AI Professor 데모"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Decorative gradient blur */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"
            />
          </motion.div>
        </div>

        {/* Features preview section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 sm:mt-20 md:mt-24 text-center"
        >
          <p className="text-xs sm:text-sm opacity-50 mb-6 sm:mb-8 uppercase tracking-wider px-2 sm:px-4">
            이런 분들께 추천해요
          </p>
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 md:gap-6 lg:gap-12 opacity-60 px-2 sm:px-4">
            {['시험 준비하는 학생', '수업 준비하는 교사', '자격증 공부', '취업 준비', '독학하는 분'].map((user, index) => (
              <motion.div
                key={user}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold whitespace-nowrap"
              >
                {user}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
