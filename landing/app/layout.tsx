import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Professor - AI 기반 교육 자료 요약 및 문제 생성",
  description: "교육 자료 PDF를 업로드하면 Claude AI가 자동으로 핵심 내용을 요약하고 예상 문제를 생성해주는 크로스 플랫폼 애플리케이션",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
