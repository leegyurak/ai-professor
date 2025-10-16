'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Features() {
  const [activeTab, setActiveTab] = useState(0);

  const features = [
    {
      title: '자료 요약',
      emoji: '📝',
      subtitle: '핵심만 쏙쏙',
      description: 'PDF 파일을 올리면 중요한 내용만 골라서 깔끔하게 정리해드려요. 100페이지짜리 교재도 몇 분이면 요약 완료!',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      title: '문제 만들기',
      emoji: '✏️',
      subtitle: '시험 대비 완벽',
      description: '공부한 내용으로 바로 문제를 만들어드려요. 객관식, 주관식, 서술형까지! 답과 풀이도 함께 제공됩니다.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      title: '내역 보관',
      emoji: '📚',
      subtitle: '언제든 다시 보기',
      description: '만들었던 요약과 문제를 모두 저장해드려요. 나중에 다시 보거나 다운로드할 수 있어 복습하기 편해요.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            이런 기능이 있어요
          </h2>
          <p className="text-xl opacity-70 max-w-2xl mx-auto">
            공부가 더 쉬워지는 세 가지 기능
          </p>
        </motion.div>

        {/* Feature Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center gap-3 mb-12"
        >
          {features.map((feature, index) => (
            <motion.button
              key={index}
              onClick={() => setActiveTab(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-3 md:px-6 py-3 rounded-lg transition-all ${
                activeTab === index
                  ? 'bg-foreground text-background'
                  : 'bg-foreground/5 hover:bg-foreground/10'
              }`}
            >
              {/* Mobile - Icon only */}
              <div className="md:hidden">
                {feature.icon}
              </div>

              {/* Desktop - Icon + Text */}
              <div className="hidden md:flex items-center gap-2">
                {feature.icon}
                <span className="font-medium">{feature.title}</span>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Feature Content */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left side - Description */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-3xl font-bold mb-2">
                {features[activeTab].title}
              </h3>
              <p className="text-xl opacity-70 mb-4">
                {features[activeTab].subtitle}
              </p>
            </div>
            <p className="text-lg opacity-80 leading-relaxed">
              {features[activeTab].description}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
            >
              자세히 보기 →
            </motion.button>
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
              <div className="aspect-video flex items-center justify-center p-8">
                <div className="text-center space-y-4">
                  <motion.div
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    className="inline-block p-6 rounded-xl bg-foreground/10"
                  >
                    {features[activeTab].icon}
                  </motion.div>
                  <p className="text-sm opacity-50">
                    {features[activeTab].title} 미리보기
                  </p>
                </div>
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
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          {[
            {
              title: '안전한 보관',
              description: '여러분의 공부 자료와 개인정보를 안전하게 보관해요. 걱정 없이 사용하세요.',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ),
            },
            {
              title: '빠른 처리',
              description: '기다리는 시간은 짧게! 파일을 올리면 몇 분 안에 요약과 문제가 뚝딱 완성됩니다.',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
            },
            {
              title: '어디서나 사용',
              description: 'Windows, Mac, Linux 모두 지원! 집에서도 학교에서도 어디서든 사용할 수 있어요.',
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="p-6 rounded-xl border border-foreground/10 bg-foreground/5 hover:bg-foreground/10 transition-colors"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="mb-4 text-blue-600 dark:text-blue-400"
              >
                {item.icon}
              </motion.div>
              <h4 className="text-xl font-semibold mb-2">{item.title}</h4>
              <p className="opacity-70">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
