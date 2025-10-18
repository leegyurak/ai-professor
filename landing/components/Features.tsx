'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Features() {
  const [activeTab, setActiveTab] = useState(0);

  const features = [
    {
      title: '요약 & 문제 출제',
      emoji: '📝',
      subtitle: '한 번에 끝내는 학습',
      description: 'PDF 파일을 올리면 핵심 내용을 정리하고 객관식, 주관식, 서술형 문제까지 자동으로 만들어드려요. 답과 풀이도 함께 제공됩니다. 여러 자료도 최대 15분이면 완료됩니다!',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      title: '중요 내용 하이라이팅',
      emoji: '✨',
      subtitle: '원하는 부분 집중 학습',
      description: '중요하게 다루고 싶은 부분을 표시하면 AI가 해당 내용을 중심으로 요약과 문제를 만들어드립니다. 시험 출제 경향에 맞춰 효율적으로 공부하세요!',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
    },
    {
      title: '내역 보관',
      emoji: '📚',
      subtitle: '언제든 다시 보기',
      description: '만들었던 요약과 문제를 모두 저장해드립니다. 언제든 다시 확인하거나 다운로드할 수 있어 복습하기 유용합니다.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="features" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-12 md:mb-16 px-2 sm:px-4"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            이런 기능이 있어요
          </h2>
          <p className="text-base sm:text-lg md:text-xl opacity-70 max-w-3xl mx-auto leading-relaxed">
            공부가 더 쉬워지는 세 가지 기능
          </p>
        </motion.div>

        {/* Feature Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-10 md:mb-12"
        >
          {features.map((feature, index) => (
            <motion.button
              key={index}
              onClick={() => setActiveTab(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg transition-all text-sm sm:text-base ${
                activeTab === index
                  ? 'bg-foreground text-background'
                  : 'bg-foreground/5 hover:bg-foreground/10'
              }`}
            >
              {/* Mobile - Icon only (very small screens) */}
              <div className="sm:hidden flex items-center justify-center">
                <div className="scale-75">
                  {feature.icon}
                </div>
              </div>

              {/* Tablet and up - Icon + Text */}
              <div className="hidden sm:flex items-center gap-2">
                {feature.icon}
                <span className="font-medium whitespace-nowrap">{feature.title}</span>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Feature Content */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
          {/* Left side - Description */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4 sm:space-y-6 px-2 sm:px-4"
          >
            <div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
                {features[activeTab].title}
              </h3>
              <p className="text-base sm:text-lg md:text-xl opacity-70 mb-3 sm:mb-4">
                {features[activeTab].subtitle}
              </p>
            </div>
            <p className="text-sm sm:text-base md:text-lg opacity-80 leading-relaxed">
              {features[activeTab].description}
            </p>
          </motion.div>

          {/* Right side - Demo/Visual */}
          <motion.div
            key={`visual-${activeTab}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            <div className="rounded-xl overflow-hidden border border-foreground/10 bg-foreground/5 shadow-xl">
              <div className="aspect-video flex items-center justify-center">
                {activeTab === 0 ? (
                  <img
                    src="/summary.gif"
                    alt="요약 및 문제 출제 데모"
                    className="w-full h-full object-cover object-left"
                  />
                ) : activeTab === 1 ? (
                  <img
                    src="/hilighting.gif"
                    alt="중요 내용 하이라이팅 데모"
                    className="w-full h-full object-cover object-left"
                  />
                ) : (
                  <img
                    src="/history.png"
                    alt="내역 보관 데모"
                    className="w-full h-full object-cover"
                    style={{
                      objectPosition: '0% 0%',
                      transform: 'scale(2.5)',
                      transformOrigin: 'top left'
                    }}
                  />
                )}
              </div>
            </div>

            {/* Decorative gradient */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-3xl rounded-full"
            />
          </motion.div>
        </div>

        {/* Additional Features Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mt-16 sm:mt-20 md:mt-24">
          {[
            {
              title: '안전한 보관',
              description: '여러분의 공부 자료와 개인정보를 안전하게 보관합니다. 걱정 없이 사용하세요.',
              icon: (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ),
            },
            {
              title: '빠른 처리',
              description: '기다리는 시간은 짧게! 여러개의 파일도 15분 안에 요약과 문제가 완성됩니다.',
              icon: (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
            },
            {
              title: '어디서나 사용',
              description: '노트북, 태블릿부터 휴대폰까지! 집에서도 학교에서도 어디서든 사용 가능합니다.',
              icon: (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ),
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="p-4 sm:p-5 md:p-6 rounded-xl border border-foreground/10 bg-foreground/5 hover:bg-foreground/10 transition-colors"
            >
              <div className="mb-3 sm:mb-4 text-blue-600 dark:text-blue-400">
                {item.icon}
              </div>
              <h4 className="text-base sm:text-lg md:text-xl font-semibold mb-1.5 sm:mb-2">{item.title}</h4>
              <p className="text-xs sm:text-sm md:text-base opacity-70 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
