// 라우트 파라미터명은 [sessionId]지만 실제로는 portfolioId를 받는다 (백엔드 /api/dashboard/{portfolioId}).
// Next.js dynamic segment naming은 라우팅 용도일 뿐 의미적 강제는 없음.
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import KpiCard from '@/components/KpiCard';
import InsightCard from '@/components/InsightCard';
import ChartRenderer from '@/components/charts/ChartRenderer';
import ReportPanel from '@/components/ReportPanel';
import SkillsReloadButton from '@/components/SkillsReloadButton';
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
  // 세션 부재(400) · 권한 없음(401·403) · 미존재(404) 모두 NotFound 처리.
  // 다른 브라우저로 URL을 직접 열거나 세션 만료된 경우의 흔한 패스.
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
  const portfolioId = params.sessionId; // 라우트 이름과 실제 값 디커플링
  const data = await fetchDashboard(portfolioId, searchParams?.mode);
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-700">← 새 분석</Link>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            {data.meta.portfolios?.[0]?.name || '대시보드'}
          </h1>
          <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-2">
            <span>Skills v{data.meta.skill_version}</span>
            <span>·</span>
            <span>mode={data.meta.mode}</span>
            <span>·</span>
            <span>audience={data.meta.audience}</span>
            <span>·</span>
            <span>{data.meta.input_period.start} ~ {data.meta.input_period.end}</span>
            {data.meta.cache_key && <span className="text-slate-400">· {data.meta.cache_key.slice(0, 20)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ModeSwitch current={data.meta.mode} portfolioId={portfolioId} />
          <SkillsReloadButton />
        </div>
      </div>

      {/* 경고 */}
      {data.meta.warnings && data.meta.warnings.length > 0 && (
        <div className="card p-3 border-amber-200 bg-amber-50">
          <ul className="text-xs text-amber-800 list-disc list-inside space-y-0.5">
            {data.meta.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {/* KPI 그리드 */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">핵심 지표</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {data.kpis.map((kpi) => <KpiCard key={kpi.id} kpi={kpi} />)}
        </div>
      </section>

      {/* 차트 그리드 */}
      {data.charts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">시각화</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.charts.map((c) => <ChartRenderer key={c.id} spec={c} />)}
          </div>
        </section>
      )}

      {/* 인사이트 */}
      {data.insights.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">인사이트 · 가드레일</h2>
          <div className="space-y-3">
            {data.insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
          </div>
        </section>
      )}

      {/* BUILD 리포트 */}
      {data.report && (
        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">BUILD 리포트</h2>
          <ReportPanel report={data.report} />
        </section>
      )}

      {/* 원시 지표 — Expert audience 또는 토글 */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">원시 지표</h2>
        <div className="card p-4">
          <pre className="text-xs overflow-x-auto text-slate-700">
            {JSON.stringify(data.raw_metrics, null, 2)}
          </pre>
        </div>
      </section>
    </div>
  );
}

function ModeSwitch({ current, portfolioId }: { current: string; portfolioId: string }) {
  const modes = ['quick', 'standard', 'full'];
  return (
    <div className="inline-flex rounded-md border border-slate-300 overflow-hidden text-xs">
      {modes.map((m) => (
        <Link
          key={m}
          href={`/dashboard/${portfolioId}?mode=${m}`}
          className={`px-3 py-1.5 border-r border-slate-300 last:border-r-0 ${
            current === m ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          {m}
        </Link>
      ))}
    </div>
  );
}
