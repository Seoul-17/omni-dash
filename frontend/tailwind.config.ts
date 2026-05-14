import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Skills 03 §3.2 색상 거버넌스 — 의미별 단일 매핑
        positive: '#10b981',
        negative: '#ef4444',
        neutral: '#64748b',
        warn: '#f59e0b',
        critical: '#dc2626',
        info: '#3b82f6',
      },
      fontFamily: {
        // Pretendard 한글 우선, Inter 라틴 fallback. 헤딩과 본문 공통.
        sans: ['"Pretendard Variable"', 'Pretendard', 'var(--font-sans)', '-apple-system', 'system-ui', 'sans-serif'],
        // JetBrains Mono — 숫자 차별화. tabular-nums 강제.
        mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        // KPI/지표 전용 — 큰 숫자 강조
        display: ['"Pretendard Variable"', 'Pretendard', 'var(--font-sans)', '-apple-system', 'system-ui', 'sans-serif'],
      },
      // App UI 금융 도구용 — 잘게 쪼개진 spacing scale
      letterSpacing: {
        'tightest': '-0.03em',
        'tracked-up': '0.04em',
      },
    },
  },
  plugins: [],
};

export default config;
