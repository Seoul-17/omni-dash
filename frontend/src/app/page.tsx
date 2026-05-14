import UploadDropzone from '@/components/UploadDropzone';
import PortfolioList from '@/components/PortfolioList';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-14 space-y-14">
      {/* Hero */}
      <section>
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-tracked-up uppercase text-blue-600 bg-blue-50 ring-1 ring-blue-100 px-2.5 py-1 rounded-full mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          Skills v3.0.0 · 룰 기반 분석 엔진
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tightest text-slate-900 leading-[1.1] mb-4">
          파편화된 투자 데이터를<br />
          <span className="text-blue-600">하나의 대시보드</span>로.
        </h1>
        <p className="text-[15px] md:text-[16px] text-slate-600 leading-relaxed max-w-2xl">
          CSV 파일을 업로드하면 Skills 명세의 검증된 분석 규칙으로
          MDD·샤프·VaR·자산군별 임계를 자동 계산하고, 의미별 색상의 시각화와
          팩트 기반 인사이트를 즉시 생성합니다.
        </p>
      </section>

      <UploadDropzone />

      {/* 최근 업로드 */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-[15px] font-semibold text-slate-900">최근 업로드</h2>
          <span className="font-mono text-[11px] tabular text-slate-400">session-scoped</span>
        </div>
        <PortfolioList />
      </section>

      {/* 지원 입력 — 더 구조적으로 */}
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
