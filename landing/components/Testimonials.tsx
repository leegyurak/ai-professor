'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export default function Testimonials() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    purpose: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/send-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          organization: '',
          purpose: '',
          message: ''
        });

        setTimeout(() => {
          setSubmitStatus('idle');
        }, 3000);
      } else {
        setSubmitStatus('error');
        setTimeout(() => {
          setSubmitStatus('idle');
        }, 3000);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitStatus('error');
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="apply" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-6 lg:px-8 bg-foreground/5">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-10 md:mb-12 px-2 sm:px-4"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            지금 신청하기
          </h2>
          <p className="text-base sm:text-lg md:text-xl opacity-70 max-w-3xl mx-auto leading-relaxed">
            정보를 입력하시면 빠르게 연락드리겠습니다
          </p>
        </motion.div>

        {/* Application Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-background rounded-2xl border border-foreground/10 p-4 sm:p-6 md:p-8 lg:p-12"
        >
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-xs sm:text-sm md:text-base font-medium mb-1.5 sm:mb-2">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg border border-foreground/20 bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base"
                placeholder="홍길동"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm md:text-base font-medium mb-1.5 sm:mb-2">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg border border-foreground/20 bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base"
                placeholder="example@email.com"
              />
            </div>

            {/* Organization */}
            <div>
              <label htmlFor="organization" className="block text-xs sm:text-sm md:text-base font-medium mb-1.5 sm:mb-2">
                소속 (학교/회사 등)
              </label>
              <input
                type="text"
                id="organization"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg border border-foreground/20 bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base"
                placeholder="서울대학교"
              />
            </div>

            {/* Purpose */}
            <div>
              <label htmlFor="purpose" className="block text-xs sm:text-sm md:text-base font-medium mb-1.5 sm:mb-2">
                사용 목적 <span className="text-red-500">*</span>
              </label>
              <select
                id="purpose"
                name="purpose"
                required
                value={formData.purpose}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg border border-foreground/20 bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base"
              >
                <option value="">선택해주세요</option>
                <option value="student">시험 준비 (학생)</option>
                <option value="teacher">수업 준비 (교사)</option>
                <option value="certificate">자격증 공부</option>
                <option value="job">취업 준비</option>
                <option value="self">독학/자기계발</option>
                <option value="other">기타</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-xs sm:text-sm md:text-base font-medium mb-1.5 sm:mb-2">
                문의사항
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={formData.message}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg border border-foreground/20 bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none text-sm sm:text-base"
                placeholder="궁금하신 점이나 요청사항을 자유롭게 작성해주세요"
              />
            </div>

            {/* Privacy Policy Notice */}
            <p className="text-xs sm:text-sm opacity-60 text-center leading-relaxed">
              신청 시 AI Professor의{' '}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-100 transition-opacity"
              >
                개인정보처리방침
              </a>
              에 동의하는 것으로 간주합니다.
            </p>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              className={`w-full px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-lg font-medium text-sm sm:text-base md:text-lg transition-all ${
                isSubmitting
                  ? 'bg-foreground/50 text-background/50 cursor-not-allowed'
                  : 'bg-foreground text-background hover:opacity-90'
              }`}
            >
              {isSubmitting ? '제출 중...' : '신청하기'}
            </motion.button>

            {/* Success Message */}
            {submitStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-center text-sm sm:text-base"
              >
                신청이 완료되었습니다! 빠른 시일 내에 연락드리겠습니다.
              </motion.div>
            )}

            {/* Error Message */}
            {submitStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-center text-sm sm:text-base"
              >
                전송에 실패했습니다. 잠시 후 다시 시도해주세요.
              </motion.div>
            )}
          </form>
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-10 sm:mt-12 md:mt-16 text-center px-2 sm:px-4"
        >
          <p className="text-xs sm:text-sm md:text-base opacity-60 mb-3 sm:mb-4 leading-relaxed">
            신청하시면 1-2일 내로 담당자가 연락드립니다
          </p>
          <p className="text-xs opacity-50 leading-relaxed">
            개인정보는 서비스 안내 목적으로만 사용되며 철저히 보호됩니다
          </p>
        </motion.div>
      </div>
    </section>
  );
}
