'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadSample } from '@/lib/api';

type SampleConfig = {
  baseCurrency?: string;
  riskProfile?: string;
  audience?: string;
  locale?: string;
  mode?: string;
};

type Sample = {
  id: string;
  file: string;
  title: string;
  desc: string;
  highlight: string;       // 어떤 기능을 보여주는지
  badge: string;           // 배지 라벨
  badgeClass: string;
  /** 이 샘플에서 강조될 분석 설정 */
  config: SampleConfig;
  /** 카드 좌측 시각 글리프 */
  glyph: 'multi' | 'wand' | 'history' | 'global' | 'kr';
  /** 미니 stats 미리보기 */
  preview: { label: string; value: string; tone?: 'pos' | 'neg' | 'neutral' }[];
};

const SAMPLES: Sample[] = [
  {
    id: 'multi-asset',
    file: '03_multi_asset.csv',
    title: '다자산 포트폴리오',
    desc: '주식 + ETF + 채권 + 암호자산 7종 혼합',
    highlight: '자산군별 차등 임계 — BTC/ETH가 crypto 15% 임계 초과로 자동 경고',
    badge: 'Featured',
    badgeClass: 'badge-info',
    config: { baseCurrency: 'KRW', mode: 'full', audience: 'intermediate' },
    glyph: 'multi',
    preview: [
      { label: '자산 수', value: '7' },
      { label: '자산군', value: '4종' },
      { label: '기준 통화', value: 'KRW' },
    ],
  },
  {
    id: 'messy',
    file: '05_messy_input.csv',
    title: '엉망 입력 자동 매핑',
    desc: '한국어 헤더 + 결측치 + 비표준 컬럼',
    highlight: 'Skills 01 §1.4 어댑터가 "티커/종목/분류/보유수량" → 표준 필드 자동 매핑',
    badge: '편의성',
    badgeClass: 'badge-warn',
    config: { baseCurrency: 'KRW', mode: 'standard', audience: 'novice' },
    glyph: 'wand',
    preview: [
      { label: '컬럼명', value: '비표준' },
      { label: '누락 셀', value: '있음' },
      { label: 'audience', value: 'novice' },
    ],
  },
  {
    id: 'transactions',
    file: '04_transactions.csv',
    title: '거래내역 자동 변환',
    desc: '매수·매도·배당 이력 → 잔고 산출',
    highlight: 'Skills 01 §1.2.2 — moving_avg법으로 평단가 자동 계산, 세후/세전 분리',
    badge: '거래내역',
    badgeClass: 'badge-positive',
    config: { baseCurrency: 'KRW', mode: 'standard', audience: 'intermediate' },
    glyph: 'history',
    preview: [
      { label: '입력 유형', value: '거래내역' },
      { label: '변환', value: 'auto' },
      { label: '평단가', value: 'MA' },
    ],
  },
];

export default function SampleShowcase() {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handle = async (sample: Sample) => {
    setError(null);
    setLoadingId(sample.id);
    try {
      const res = await uploadSample(sample.file, sample.config);
      router.push(`/dashboard/${res.portfolioId}?mode=${sample.config.mode || 'standard'}`);
    } catch (e: any) {
      setError(e?.message || '샘플 로드 실패');
      setLoadingId(null);
    }
  };

  return (
    <section id="sample-showcase" className="scroll-mt-16">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="section-eyebrow mb-1">또는 샘플로 둘러보기</div>
          <h2 className="text-[15px] font-semibold text-slate-900">
            CSV가 없어도 — 검증 데이터로 바로 체험하세요
          </h2>
        </div>
        <span className="font-mono text-[11px] tabular text-slate-400 hidden md:inline">
          docs/final_skills/examples
        </span>
      </div>

      {error && (
        <div className="card border-l-2 border-l-red-500 p-3 mb-3">
          <p className="text-red-700 text-[13px] font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SAMPLES.map((s) => (
          <SampleCard
            key={s.id}
            sample={s}
            loading={loadingId === s.id}
            disabled={loadingId !== null && loadingId !== s.id}
            onClick={() => handle(s)}
          />
        ))}
      </div>
    </section>
  );
}

function SampleCard({
  sample, loading, disabled, onClick,
}: {
  sample: Sample;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className={[
        'card group p-4 text-left flex flex-col relative',
        'hover:border-blue-300 hover:shadow-[0_4px_16px_-8px_rgba(15,23,42,0.15)]',
        'transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40',
        loading ? 'ring-2 ring-blue-500/40' : '',
        disabled ? 'opacity-50 pointer-events-none' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-slate-900 text-white shrink-0">
          {loading ? <Spinner /> : <Glyph kind={sample.glyph} />}
        </div>
        <span className={`badge ${sample.badgeClass}`}>{sample.badge}</span>
      </div>

      <h3 className="font-semibold text-slate-900 text-[14px] leading-tight mb-1">
        {sample.title}
      </h3>
      <p className="text-[12px] text-slate-600 leading-snug mb-3">{sample.desc}</p>

      {/* 시연 포인트 — 진짜 가치 */}
      <p className="text-[11px] text-slate-500 leading-relaxed mb-3 line-clamp-2">
        <span className="font-mono text-slate-700 text-[10px] mr-1">→</span>
        {sample.highlight}
      </p>

      {/* 미니 stats */}
      <div className="mt-auto pt-3 border-t border-slate-100 grid grid-cols-3 gap-1">
        {sample.preview.map((p, i) => (
          <div key={i} className="min-w-0">
            <div className="text-[9px] font-semibold tracking-tracked-up uppercase text-slate-400 truncate">
              {p.label}
            </div>
            <div className={[
              'font-mono text-[11px] tabular font-semibold truncate',
              p.tone === 'pos' ? 'text-emerald-600'
              : p.tone === 'neg' ? 'text-red-600'
              : 'text-slate-700',
            ].join(' ')}>
              {p.value}
            </div>
          </div>
        ))}
      </div>

      {/* 우하단 화살표 */}
      <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition pointer-events-none">
        <svg viewBox="0 0 12 12" className="w-3 h-3 text-slate-400" fill="none">
          <path d="M3 6H9M9 6L6 3M9 6L6 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </button>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Glyph({ kind }: { kind: Sample['glyph'] }) {
  switch (kind) {
    case 'multi':
      return (
        <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
          <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="14" cy="6" r="3" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="6" cy="14" r="3" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="14" cy="14" r="3" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      );
    case 'wand':
      return (
        <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
          <path d="M3 17L13 7M11 4L13 6M16 9L14 7M15 14L17 16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <circle cx="13" cy="7" r="0.5" fill="currentColor" />
          <path d="M5 5L6 6M14 16L15 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'history':
      return (
        <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
          <path d="M10 5V10L13 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 10A7 7 0 1 0 5.5 4.5M3 10V6M3 10H7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'global':
      return (
        <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.75" />
          <path d="M3 10H17M10 3C12 6 12 14 10 17M10 3C8 6 8 14 10 17" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'kr':
      return (
        <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
          <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <path d="M6 9H14M6 12H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
}
