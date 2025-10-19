'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export default function Testimonials() {
  const [email, setEmail] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, purpose }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: '가입 요청이 성공적으로 전송되었습니다. 곧 연락드리겠습니다!',
        });
        setEmail('');
        setPurpose('');
      } else {
        setMessage({
          type: 'error',
          text: data.error || '요청 처리 중 오류가 발생했습니다.',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <section id="apply" className="py-16 sm:py-20 md:py-24 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16 px-2 sm:px-4"
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 tracking-tight">
            지금 신청하기
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl opacity-70 max-w-2xl mx-auto">
            간단한 가입으로 AI Professor를 시작하세요
          </p>
        </motion.div>

        {/* Application Steps */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Step 1 Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative bg-foreground/5 rounded-2xl p-8 border-2 border-foreground/10 hover:border-foreground/20 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-foreground text-background flex items-center justify-center font-bold text-xl">
                1
              </div>
              <div className="flex-1 pt-1">
                <p className="text-lg sm:text-xl font-medium">
                  <a
                    href="https://ai-professor.me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4 decoration-2 hover:opacity-70 transition-opacity"
                  >
                    서비스
                  </a>
                  <span className="opacity-70">로 이동해서 가입</span>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Step 2 Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative bg-foreground/5 rounded-2xl p-8 border-2 border-foreground/10 hover:border-foreground/20 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-foreground text-background flex items-center justify-center font-bold text-xl">
                2
              </div>
              <div className="flex-1 pt-1">
                <p className="text-lg sm:text-xl font-medium opacity-90">
                  이메일과 사용 목적 입력
                </p>
                <p className="text-sm sm:text-base mt-2 opacity-60">
                  1~2일 내에 승인 메일 도착
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Signup Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-foreground/5 rounded-2xl border-2 border-foreground/10 p-6 sm:p-8 md:p-10"
        >
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 opacity-70">
                  이메일 주소
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-lg border-2 border-foreground/10 bg-background text-foreground placeholder:text-foreground/40 focus:border-foreground/30 focus:outline-none transition-colors text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 opacity-70">
                  사용 목적
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                  placeholder="예: 시험 준비"
                  className="w-full px-4 py-3 rounded-lg border-2 border-foreground/10 bg-background text-foreground placeholder:text-foreground/40 focus:border-foreground/30 focus:outline-none transition-colors text-base"
                />
              </div>
            </div>

            {message && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-lg text-sm font-medium ${
                  message.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-2 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-2 border-red-200 dark:border-red-800'
                }`}
              >
                {message.text}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full px-6 py-4 bg-foreground text-background rounded-lg font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            >
              {isSubmitting ? '전송 중...' : '승인 요청하기'}
            </motion.button>
          </form>
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-8 text-center px-2 sm:px-4"
        >
          <p className="text-sm opacity-60">
            * 승인까지 1~2일 정도 소요됩니다
          </p>
        </motion.div>
      </div>
    </section>
  );
}
