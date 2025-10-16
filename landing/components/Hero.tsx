'use client';

import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center px-4 py-2 rounded-full border border-foreground/20 mb-8"
          >
            <span className="text-sm">
              AI 기반 학습 도우미
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6 text-balance max-w-5xl mx-auto leading-tight"
          >
            공부 자료를{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              요약하고
            </span>{' '}
            문제를 만들어드려요
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl opacity-70 mb-12 max-w-3xl mx-auto text-balance"
          >
            PDF 파일만 올리면 핵심 내용 정리와 예상 문제를 자동으로 만들어드립니다
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-foreground text-background rounded-lg font-medium text-lg hover:opacity-90 transition-opacity w-full sm:w-auto"
            >
              지금 신청하기
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 border border-foreground/20 rounded-lg font-medium text-lg hover:bg-foreground/5 transition-colors w-full sm:w-auto"
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
              <div className="aspect-video flex items-center justify-center p-8">
                <div className="text-center space-y-4">
                  <motion.div
                    animate={{
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.05, 1.05, 1]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    className="inline-block p-6 rounded-xl bg-foreground/10"
                  >
                    <svg
                      className="w-16 h-16 opacity-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </motion.div>
                  <p className="text-sm opacity-50">
                    PDF 업로드 → AI 분석 → 요약 & 문제 생성
                  </p>
                </div>
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
          className="mt-24 text-center"
        >
          <p className="text-sm opacity-50 mb-8 uppercase tracking-wider">
            이런 분들께 추천해요
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60">
            {['시험 준비하는 학생', '수업 준비하는 교사', '자격증 공부', '취업 준비', '독학하는 분'].map((user, index) => (
              <motion.div
                key={user}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                className="text-lg font-semibold"
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
