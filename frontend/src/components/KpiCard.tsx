import type { KPI } from '@/types/dashboard';
import { formatKpiValue, severityClass, valueDirectionClass } from '@/lib/format';

export default function KpiCard({ kpi }: { kpi: KPI }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-1">
        <span className="text-xs font-medium text-slate-500">{kpi.label}</span>
        {kpi.severity && (
          <span className={`badge ${severityClass(kpi.severity)}`}>{kpi.severity}</span>
        )}
      </div>
      <div className={`text-2xl font-semibold ${valueDirectionClass(kpi.semantic_color)}`}>
        {formatKpiValue(kpi.value, kpi.unit)}
      </div>
      <div className="mt-2 text-xs text-slate-400 truncate">
        {kpi.ref.metric} · n={kpi.ref.n}
      </div>
    </div>
  );
}
