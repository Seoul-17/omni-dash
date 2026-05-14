import type { KPI } from '@/types/dashboard';
import { formatKpiValue, severityClass, valueDirectionClass } from '@/lib/format';

/**
 * 두 모드:
 * - hero: 가장 중요한 1~2개 KPI. 큰 폰트 + Pretendard, 상단 그라데이션 띠.
 * - default: 보조 KPI. 컴팩트하지만 숫자는 여전히 mono + tabular.
 */
export default function KpiCard({
  kpi,
  variant = 'default',
}: {
  kpi: KPI;
  variant?: 'hero' | 'default';
}) {
  const isHero = variant === 'hero';
  const ValueEl = (
    <div
      className={[
        'font-display tabular',
        valueDirectionClass(kpi.semantic_color),
        isHero ? 'text-4xl md:text-5xl font-bold tracking-tightest leading-none' : 'text-2xl font-semibold tracking-tight',
      ].join(' ')}
    >
      {formatKpiValue(kpi.value, kpi.unit)}
    </div>
  );

  if (isHero) {
    return (
      <div className="kpi-hero">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="section-eyebrow">{kpi.label}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {kpi.ref.metric.replace(/_/g, ' ')} · n={kpi.ref.n}
            </div>
          </div>
          {kpi.severity && (
            <span className={`badge ${severityClass(kpi.severity)}`}>{kpi.severity}</span>
          )}
        </div>
        {ValueEl}
        {kpi.change !== undefined && kpi.change !== null && (
          <div className="mt-3 text-[12px] text-slate-500 tabular">
            전기 대비 <span className={valueDirectionClass(kpi.change >= 0 ? 'positive' : 'negative')}>
              {kpi.change >= 0 ? '+' : ''}{kpi.change.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    );
  }

  // default — 컴팩트
  return (
    <div className="card p-4 flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <span className="section-eyebrow truncate">{kpi.label}</span>
        {kpi.severity && (
          <span className={`badge ${severityClass(kpi.severity)} shrink-0`}>{kpi.severity}</span>
        )}
      </div>
      {ValueEl}
      <div className="text-[10px] text-slate-400 tabular truncate">
        n={kpi.ref.n}
      </div>
    </div>
  );
}
