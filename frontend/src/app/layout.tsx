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
        <div className="min-h-screen">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
              <a href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight">
                  <span className="text-blue-600">Omni</span>-Dash
                </span>
                <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600">v3.0</span>
              </a>
              <nav className="flex items-center gap-4 text-sm">
                <a href="/" className="text-slate-600 hover:text-slate-900">업로드</a>
                <a href="https://github.com/" className="text-slate-600 hover:text-slate-900">GitHub</a>
              </nav>
            </div>
          </header>
          <main>{children}</main>
          <footer className="border-t border-slate-200 mt-12 bg-white">
            <div className="mx-auto max-w-7xl px-6 py-6 text-xs text-slate-500">
              본 분석은 정보 제공 목적이며 투자 자문이 아닙니다. (Skills 00 §0.5.2 면책)
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
