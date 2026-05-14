// 라우트 파라미터명은 [sessionId]지만 실제로는 portfolioId를 받는다.
// Next.js dynamic segment naming은 라우팅 용도일 뿐 의미적 강제는 없음.
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import KpiCard from '@/components/KpiCard';
import InsightCard from '@/components/InsightCard';
import ChartRenderer from '@/components/charts/ChartRenderer';
import ReportPanel from '@/components/ReportPanel';
import SkillsReloadButton from '@/components/SkillsReloadButton';
import RawMetricsDisclosure from '@/components/RawMetricsDisclosure';
import type { DashboardOutput } from '@/types/dashboard';

const INTERNAL_BASE = process.env.INTERNAL_API_BASE_URL || 'http://localhost:8080';

async function fetchDashboard(portfolioId: string, mode: string | undefined): Promise<DashboardOutput | null> {
  const h = headers();
  const cookie = h.get('cookie') || '';
  const q = mode ? `?mode=${encodeURIComponent(mode)}` : '';
  const res = await fetch(`${INTERNAL_BASE}/api/dashboard/${portfolioId}${q}`, {
    headers: { cookie },
    cache: 'no-store',
  });
  if ([400, 401, 403, 404].includes(res.status)) return null;
  if (!res.ok) {
    let body: any = null;
    try { body = await res.json(); } catch {}
    throw new Error(body?.message || `Dashboard fetch failed: ${res.status}`);
  }
  return res.json();
}

export default async function DashboardPage({
  params, searchParams,
}: {
  params: { sessionId: string };
  searchParams: { mode?: string };
}) {
  const portfolioId = params.sessionId;
  const data = await fetchDashboard(portfolioId, searchParams?.mode);
  if (!data) notFound();

  // KPI hierarchy 분리: 첫 2개 = hero, 나머지 = default grid
  const heroKpis = data.kpis.slice(0, 2);
  const restKpis = data.kpis.slice(2);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-10">
      {/* ─── 헤더 ─── */}
      <header className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="min-w-0">
          <Link href="/" className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 mb-2 transition">
            <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M7.5 3L4.5 6L7.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            새 분석
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tightest text-slate-900 truncate">
            {data.meta.portfolios?.[0]?.name || 'Dashboard'}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
            <Meta label="Skills" value={`v${data.meta.skill_version}`} />
            <Sep />
            <Meta label="Mode" value={data.meta.mode} highlight />
            <Sep />
            <Meta label="Audience" value={data.meta.audience} />
            <Sep />
            <Meta label="Period" value={`${data.meta.input_period.start} → ${data.meta.input_period.end}`} mono />
            {data.meta.cache_key && (<>
              <Sep />
              <Meta label="Cache" value={data.meta.cache_key.replace('sha256:', '').slice(0, 8)} mono />
            </>)}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ModeSwitch current={data.meta.mode} portfolioId={portfolioId} />
          <SkillsReloadButton />
        </div>
      </header>

      {/* ─── 경고 ─── */}
      {data.meta.warnings && data.meta.warnings.length > 0 && (
        <section className="card border-amber-200 bg-amber-50/40 p-3">
          <div className="flex items-start gap-2">
            <span className="text-amber-600 mt-0.5">⚠️</span>
            <ul className="text-[12px] text-amber-800 space-y-0.5 leading-relaxed">
              {data.meta.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        </section>
      )}

      {/* ─── BUILD B: BLUF (가장 위로) ─── */}
      {data.report?.B && (
        <section>
          <div className="section-eyebrow mb-2">B · 한 줄 요약</div>
          <p className="text-lg leading-relaxed text-slate-800 max-w-4xl">
            {data.report.B.bluf}
          </p>
        </section>
      )}

      {/* ─── KPI: Hero 2개 + 나머지 그리드 ─── */}
      <section>
        <div className="section-eyebrow mb-3">핵심 지표</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          {heroKpis.map(k => <KpiCard key={k.id} kpi={k} variant="hero" />)}
        </div>
        {restKpis.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {restKpis.map(k => <KpiCard key={k.id} kpi={k} />)}
          </div>
        )}
      </section>

      {/* ─── 차트 ─── */}
      {data.charts.length > 0 && (
        <section>
          <div className="section-eyebrow mb-3">시각화 · {data.charts.length}개</div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.charts.map(c => <ChartRenderer key={c.id} spec={c} />)}
          </div>
        </section>
      )}

      {/* ─── 인사이트 ─── */}
      {data.insights.length > 0 && (
        <section>
          <div className="section-eyebrow mb-3">인사이트 · 가드레일 · {data.insights.length}개</div>
          <div className="space-y-2.5">
            {data.insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
          </div>
        </section>
      )}

      {/* ─── BUILD 리포트 (U/I/L/D — B는 위에서 노출) ─── */}
      {data.report && (
        <section>
          <div className="section-eyebrow mb-3">상세 리포트 · BUILD 프레임</div>
          <ReportPanel report={data.report} hideBluf />
        </section>
      )}

      {/* ─── 원시 지표 (기본 접힘) ─── */}
      <section>
        <div className="section-eyebrow mb-2">원시 지표 (JSON)</div>
        <RawMetricsDisclosure data={data.raw_metrics} />
      </section>
    </div>
  );
}

function Meta({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-slate-400">{label}</span>
      <span className={[
        highlight ? 'text-blue-600 font-semibold' : 'text-slate-700 font-medium',
        mono ? 'font-mono tabular' : '',
      ].join(' ')}>{value}</span>
    </span>
  );
}

function Sep() { return <span className="text-slate-300">·</span>; }

function ModeSwitch({ current, portfolioId }: { current: string; portfolioId: string }) {
  const modes: { key: string; label: string }[] = [
    { key: 'quick', label: 'Quick' },
    { key: 'standard', label: 'Standard' },
    { key: 'full', label: 'Full' },
  ];
  return (
    <div className="inline-flex rounded-md bg-slate-100 p-0.5 text-[12px] font-medium">
      {modes.map(m => (
        <Link
          key={m.key}
          href={`/dashboard/${portfolioId}?mode=${m.key}`}
          className={[
            'px-3 py-1.5 rounded-md transition',
            current === m.key
              ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
              : 'text-slate-600 hover:text-slate-900',
          ].join(' ')}
        >
          {m.label}
        </Link>
      ))}
    </div>
  );
}
