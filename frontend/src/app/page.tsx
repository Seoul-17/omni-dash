import UploadDropzone from '@/components/UploadDropzone';
import PortfolioList from '@/components/PortfolioList';
import SampleShowcase from '@/components/SampleShowcase';

export default function HomePage() {
  return (
    <div className="relative">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-white">
        {/* 배경 그라데이션 mesh */}
        <div aria-hidden className="absolute inset-0 -z-10">
          {/* 상단 우측 오렌지/블루 그로우 */}
          <div className="absolute -top-32 right-[-10%] w-[640px] h-[640px] rounded-full
                          bg-[radial-gradient(closest-side,rgba(37,99,235,0.18),rgba(37,99,235,0))]" />
          {/* 좌측 하단 미세 보라 (악센트) */}
          <div className="absolute -bottom-40 -left-32 w-[520px] h-[520px] rounded-full
                          bg-[radial-gradient(closest-side,rgba(124,58,237,0.10),rgba(124,58,237,0))]" />
          {/* 베이스 그라데이션 */}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/40 to-white" />
          {/* 미세 그리드 dot */}
          <div className="absolute inset-0 opacity-50"
               style={{
                 backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(15,23,42,0.06) 1px, transparent 0)',
                 backgroundSize: '24px 24px',
               }} />
        </div>

        <div className="mx-auto max-w-7xl px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-8 items-center">
            {/* ── 텍스트 컬럼 ── */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-tracked-up uppercase
                              text-blue-700 bg-blue-50 ring-1 ring-blue-100 px-2.5 py-1 rounded-full mb-5">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-blue-400 opacity-60 animate-ping" />
                  <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-blue-600" />
                </span>
                Skills v3.0.0 · 룰 기반 분석 엔진
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tightest text-slate-900 leading-[1.05] mb-5">
                파편화된 투자 데이터를<br />
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-br from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    하나의 대시보드
                  </span>
                  {/* 헤딩 텍스트 아래 미세 underline glow */}
                  <span aria-hidden className="absolute left-0 right-0 -bottom-1 h-2
                                              bg-gradient-to-r from-blue-500/30 via-blue-500/10 to-transparent blur-sm" />
                </span>
                로.
              </h1>

              <p className="text-[15px] md:text-[16px] text-slate-600 leading-relaxed max-w-xl mb-7">
                CSV 한 번에 Skills 명세의 검증된 분석 규칙으로
                <span className="font-mono text-slate-700"> MDD·샤프·VaR·자산군별 임계 </span>
                를 자동 계산하고, 의미별 색상의 시각화와 팩트 기반 인사이트를 즉시 생성합니다.
              </p>

              {/* 신뢰성 인디케이터 */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-slate-500">
                <Trust label="Skills 명세" value="6 모듈 · 1,400+ 라인" />
                <span className="hidden md:inline text-slate-300">·</span>
                <Trust label="자산군 임계" value="6개 클래스 차등" />
                <span className="hidden md:inline text-slate-300">·</span>
                <Trust label="환각 방지" value="ref 추적 강제" />
              </div>
            </div>

            {/* ── 비주얼 컬럼 (2개 SVG 레이어드) ── */}
            <div className="relative">
              {/* 뒷쪽 accent curves — 카드 위쪽 + 좌측으로 노출되도록 */}
              <div aria-hidden
                   className="absolute -top-14 -left-8 lg:-left-20 w-[110%] max-w-[540px]
                              opacity-100 pointer-events-none z-0">
                <img
                  src="/hero-accent-curves.svg"
                  alt=""
                  className="w-full h-auto"
                />
              </div>

              {/* 메인 대시보드 글림스 카드 */}
              <div className="relative z-10 rounded-2xl
                              shadow-[0_24px_60px_-20px_rgba(15,23,42,0.25),0_8px_24px_-12px_rgba(37,99,235,0.18)]
                              ring-1 ring-slate-900/5
                              bg-white/70 backdrop-blur-md
                              transform lg:translate-x-4 lg:translate-y-6
                              transition-transform duration-300 hover:translate-y-4">
                {/* 카드 위쪽 highlight */}
                <div aria-hidden className="absolute inset-x-0 top-0 h-px
                                            bg-gradient-to-r from-transparent via-blue-400/70 to-transparent" />
                <img
                  src="/hero-dashboard-glimpse.svg"
                  alt="Omni-Dash 대시보드 미리보기 — 총 수익률 +102.08%, CAGR +74.02% 와 누적 수익률 차트가 표시된 미니어처 카드"
                  className="w-full h-auto rounded-2xl relative z-10"
                />
              </div>

              {/* 부유 mini-pill (수치 강조) */}
              <div aria-hidden
                   className="hidden md:flex absolute -bottom-4 -left-4 z-20 items-center gap-2
                              bg-white rounded-lg shadow-lg ring-1 ring-slate-200/80 px-3 py-2">
                <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center">
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-emerald-600" fill="none">
                    <path d="M2 11L6 7L9 9L14 4M14 4H10M14 4V8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div className="text-[9px] font-semibold tracking-tracked-up uppercase text-slate-500">SHARPE</div>
                  <div className="text-[13px] font-bold tabular font-mono text-slate-900 leading-tight">1.59</div>
                </div>
              </div>

              <div aria-hidden
                   className="hidden md:flex absolute -top-3 left-12 z-20 items-center gap-2
                              bg-slate-900 text-white rounded-lg shadow-lg px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-semibold tracking-tracked-up uppercase">LIVE</span>
                <span className="font-mono text-[11px] tabular text-slate-300">320 days</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 본문 ─── */}
      <div className="mx-auto max-w-5xl px-6 py-14 space-y-12">
        <UploadDropzone />

        {/* 샘플 데이터 — 빈 세션에서 즉시 체험 */}
        <SampleShowcase />

        {/* 최근 업로드 */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-slate-900">최근 업로드</h2>
            <span className="font-mono text-[11px] tabular text-slate-400">session-scoped</span>
          </div>
          <PortfolioList />
        </section>

        {/* 지원 입력 */}
        <section>
          <div className="section-eyebrow mb-3">지원 입력 형식</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormatCard
              title="잔고 스냅샷"
              korean="종목코드, 종목명, 수량, 평단가"
              english="asset_id, asset_class, quantity, avg_cost"
              desc="현재 보유 자산 한 줄씩"
            />
            <FormatCard
              title="거래내역"
              korean="거래일, 매매구분, 수량, 단가, 수수료"
              english="executed_at, side, quantity, price, fees"
              desc="자동으로 잔고 + 평단가(moving avg) 환산"
            />
          </div>
          <p className="mt-3 text-[12px] text-slate-500">
            헤더가 표준과 다르면 <span className="font-mono text-slate-700">Skills 01 §1.4</span> 어댑터가 자동 매핑합니다.
            한국어·영문 혼재, 결측치 보정도 지원.
          </p>
        </section>
      </div>
    </div>
  );
}

function Trust({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg viewBox="0 0 12 12" className="w-3 h-3 text-emerald-600 shrink-0" fill="none">
        <path d="M3 6L5 8L9 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </span>
  );
}

function FormatCard({ title, korean, english, desc }: {
  title: string; korean: string; english: string; desc: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold text-slate-900 text-[13px]">{title}</span>
        <span className="badge badge-info">CSV</span>
      </div>
      <div className="space-y-1.5 mb-2">
        <code className="block font-mono text-[11px] text-slate-700 bg-slate-50/80 ring-1 ring-slate-100 rounded px-2 py-1.5 leading-relaxed">
          {korean}
        </code>
        <code className="block font-mono text-[11px] text-slate-700 bg-slate-50/80 ring-1 ring-slate-100 rounded px-2 py-1.5 leading-relaxed">
          {english}
        </code>
      </div>
      <p className="text-[11px] text-slate-500">{desc}</p>
    </div>
  );
}
