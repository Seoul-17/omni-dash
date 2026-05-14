import type { Report } from '@/types/dashboard';
import { formatPercent } from '@/lib/format';

export default function ReportPanel({ report, hideBluf }: { report: Report; hideBluf?: boolean }) {
  return (
    <div className="space-y-4">
      {/* B — BLUF (페이지 상단에 별도 노출되는 경우 hideBluf=true) */}
      {!hideBluf && (
        <Section title="B · 한 줄 요약 (BLUF)">
          <p className="text-slate-700">{report.B.bluf}</p>
        </Section>
      )}

      {/* U — Context */}
      <Section title={`U · 시장 컨텍스트 (vs ${report.U.benchmark.benchmark_id})`}>
        <p className="text-sm text-slate-600 mb-3">{report.U.context}</p>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <Mini label="절대 수익률" value={formatPercent(report.U.benchmark.absolute_return * 100)} />
          <Mini label="상대 수익률" value={formatPercent(report.U.benchmark.relative_return * 100)} />
          <Mini label="추적오차" value={formatPercent(report.U.benchmark.tracking_error * 100)} />
        </div>
      </Section>

      {/* I — Investigate */}
      <Section title="I · 기여·차감 자산">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AttributionTable title="📈 기여" rows={report.I.contributors.slice(0, 5)} positive />
          <AttributionTable title="📉 차감" rows={report.I.detractors.slice(0, 5)} />
        </div>
      </Section>

      {/* L — Liability */}
      <Section title="L · 시나리오 분석">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {report.L.scenarios.map((s) => (
            <div key={s.label} className="border border-slate-200 rounded-lg p-3">
              <div className="text-xs font-semibold text-slate-500 mb-1">{s.label}</div>
              <div className="text-xl font-semibold text-slate-800">
                {formatPercent(s.expected_return * 100)}
              </div>
              <div className="text-xs text-slate-500">
                MDD {formatPercent(s.expected_mdd * 100)}
              </div>
              <ul className="mt-2 text-xs text-slate-500 list-disc list-inside space-y-0.5">
                {s.assumptions.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* D — Direction */}
      <Section title="D · 권장 액션">
        <div className="space-y-2">
          {report.D.actions.map((a, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="badge bg-blue-100 text-blue-700 shrink-0">{a.action}</span>
              <div className="text-sm">
                {a.asset_id && <span className="font-medium">{a.asset_id} · </span>}
                {a.target_weight !== undefined && a.target_weight !== null &&
                  <span>목표 비중 {formatPercent(a.target_weight * 100)} · </span>}
                <span className="text-slate-600">{a.rationale}</span>
                {a.deadline && <span className="text-xs text-slate-400"> ({a.deadline})</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-slate-500">
          <span className="font-medium">모니터링 지표: </span>
          {report.D.monitoring.join(', ')}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  // 헤더 구조: 작은 캡스 라벨 + 본문
  const [code, ...rest] = title.split(' · ');
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-[11px] font-semibold tracking-tracked-up uppercase text-slate-400">
          {code}
        </span>
        <span className="h-px flex-1 bg-slate-200/80" />
        <h3 className="font-semibold text-slate-800 text-[13px]">{rest.join(' · ')}</h3>
      </div>
      {children}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-slate-200 rounded-md p-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function AttributionTable({
  title, rows, positive,
}: { title: string; rows: { asset_id: string; asset_name: string; contribution_pct: number; weight: number; return_pct: number }[]; positive?: boolean }) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-500 mb-2">{title}</div>
      <div className="space-y-1">
        {rows.length === 0 ? (
          <div className="text-xs text-slate-400">해당 없음</div>
        ) : rows.map((r) => (
          <div key={r.asset_id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
            <span className="font-medium text-slate-700 truncate mr-2">{r.asset_name}</span>
            <span className={`shrink-0 ${positive ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatPercent(r.contribution_pct)} ({formatPercent(r.return_pct)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
