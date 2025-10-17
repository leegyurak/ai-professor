'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/10">
        <nav className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link href="/" className="text-lg sm:text-xl md:text-2xl font-bold">
              AI Professor
            </Link>
          </div>
        </nav>
      </header>

      {/* Content */}
      <main className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              개인정보처리방침
            </h1>
            <p className="text-sm sm:text-base opacity-70 mb-8 sm:mb-12">
              최종 수정일: {new Date().toLocaleDateString('ko-KR')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="prose prose-sm sm:prose-base max-w-none"
          >
            <section className="mb-8 sm:mb-10">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">1. 개인정보의 수집 및 이용 목적</h2>
              <p className="text-sm sm:text-base opacity-80 leading-relaxed mb-3">
                AI Professor는 다음의 목적을 위하여 개인정보를 처리합니다. 처리한 개인정보는 다음의 목적 이외의 용도로는 사용되지 않으며, 이용 목적이 변경될 시에는 사전 동의를 구할 예정입니다.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm sm:text-base opacity-80 ml-2 sm:ml-4">
                <li>서비스 제공 및 개선</li>
                <li>이용자 문의 및 고객 지원</li>
                <li>서비스 개선을 위한 통계 및 분석</li>
                <li>신규 서비스 개발 및 맞춤형 서비스 제공</li>
              </ul>
            </section>

            <section className="mb-8 sm:mb-10">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">2. 수집하는 개인정보의 항목</h2>
              <p className="text-sm sm:text-base opacity-80 leading-relaxed mb-3">
                AI Professor는 서비스 신청 및 이용을 위해 다음과 같은 개인정보를 수집합니다.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm sm:text-base opacity-80 ml-2 sm:ml-4">
                <li><strong>필수 항목:</strong> 이름, 이메일, 사용 목적</li>
                <li><strong>선택 항목:</strong> 소속(학교/회사 등), 문의사항</li>
              </ul>
            </section>

            <section className="mb-8 sm:mb-10">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">3. 개인정보의 보유 및 이용 기간</h2>
              <p className="text-sm sm:text-base opacity-80 leading-relaxed">
                회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm sm:text-base opacity-80 ml-2 sm:ml-4 mt-3">
                <li><strong>서비스 신청 정보:</strong> 신청일로부터 3년</li>
                <li><strong>문의 내역:</strong> 문의 처리 완료 후 1년</li>
              </ul>
            </section>

            <section className="mb-8 sm:mb-10">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">4. 개인정보의 제3자 제공</h2>
              <p className="text-sm sm:text-base opacity-80 leading-relaxed">
                AI Professor는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm sm:text-base opacity-80 ml-2 sm:ml-4 mt-3">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              </ul>
            </section>

            <section className="mb-8 sm:mb-10">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">5. 개인정보의 파기</h2>
              <p className="text-sm sm:text-base opacity-80 leading-relaxed">
                AI Professor는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다. 전자적 파일 형태의 정보는 복구 및 재생되지 않도록 안전하게 삭제하며, 종이 문서는 분쇄기로 분쇄하거나 소각합니다.
              </p>
            </section>

            <section className="mb-8 sm:mb-10">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">6. 정보주체의 권리·의무 및 행사방법</h2>
              <p className="text-sm sm:text-base opacity-80 leading-relaxed mb-3">
                정보주체는 AI Professor에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm sm:text-base opacity-80 ml-2 sm:ml-4">
                <li>개인정보 열람 요구</li>
                <li>개인정보 정정·삭제 요구</li>
                <li>개인정보 처리정지 요구</li>
              </ul>
              <p className="text-sm sm:text-base opacity-80 leading-relaxed mt-3">
                권리 행사는 AI Professor에 대해 서면, 전화, 전자우편 등을 통하여 하실 수 있으며, AI Professor는 이에 대해 지체 없이 조치하겠습니다.
              </p>
            </section>

            <section className="mb-8 sm:mb-10">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">7. 개인정보 보호책임자</h2>
              <p className="text-sm sm:text-base opacity-80 leading-relaxed mb-3">
                AI Professor는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
              </p>
              <div className="bg-foreground/5 p-4 sm:p-6 rounded-lg text-sm sm:text-base opacity-80">
                <p className="mb-2"><strong>개인정보 보호책임자</strong></p>
                <p>이메일: privacy@ai-professor.me</p>
              </div>
            </section>

            <section className="mb-8 sm:mb-10">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">8. 개인정보 처리방침의 변경</h2>
              <p className="text-sm sm:text-base opacity-80 leading-relaxed">
                이 개인정보 처리방침은 {new Date().getFullYear()}년 {new Date().getMonth() + 1}월 {new Date().getDate()}일부터 적용됩니다. 법령, 정책 또는 보안기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 시에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
              </p>
            </section>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 sm:mt-12"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-foreground text-background rounded-lg font-medium text-sm sm:text-base hover:opacity-90 transition-opacity"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              홈으로 돌아가기
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
