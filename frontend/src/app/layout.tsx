import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import '../styles/globals.css';

// Pretendard는 next/font로 직접 로드가 어려워 CDN 사용. Inter는 fallback.
// 헤딩에는 Pretendard(한글 + 묵직한 sans), 본문에는 Inter,
// 숫자/KPI에는 JetBrains Mono (tabular-nums + 금융 도구의 신뢰성).
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Omni-Dash — 금융 투자 대시보드 자동 생성',
  description: 'CSV 한 번에 검증된 분석 규칙(Skills.md) 기반 투자 대시보드를 자동 생성합니다.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${inter.variable} ${mono.variable}`}>
      <head>
        {/* Pretendard — 한국어 금융 UI의 사실상 표준 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-30 backdrop-blur-md bg-white/85 border-b border-slate-200/80">
            <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
              <a href="/" className="flex items-center gap-2.5 group">
                {/* 로고: 작은 차트 모양 글리프 + 워드마크 */}
                <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-md bg-slate-900 text-white">
                  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                    <path d="M2 12V10M6 12V6M10 12V8M14 12V4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="font-semibold text-[15px] tracking-tightest text-slate-900">
                  Omni<span className="text-blue-600">·</span>Dash
                </span>
                <span className="badge badge-info">v3.0</span>
              </a>
              <nav className="flex items-center gap-1 text-[13px] font-medium">
                <a href="/" className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition">
                  업로드
                </a>
                <a href="https://github.com/" className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition">
                  GitHub
                </a>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-200/80 mt-16 bg-white/50">
            <div className="mx-auto max-w-7xl px-6 py-5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
              <span>
                본 분석은 정보 제공 목적이며 투자 자문이 아닙니다.
                <span className="text-slate-400 ml-1">(Skills 00 §0.5.2)</span>
              </span>
              <span className="font-mono tabular text-slate-400">
                Skills · v3.0.0
              </span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
