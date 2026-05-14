import type { Insight } from '@/types/dashboard';
import { severityClass } from '@/lib/format';

const SEVERITY_BORDER: Record<string, string> = {
  critical: 'border-l-red-500',
  warn: 'border-l-amber-500',
  info: 'border-l-blue-500',
};

export default function InsightCard({ insight }: { insight: Insight }) {
  const borderClass = SEVERITY_BORDER[insight.severity] || SEVERITY_BORDER.info;
  return (
    <div className={`card border-l-2 ${borderClass} p-4`}>
      <div className="flex items-start gap-3">
        <div className="text-lg leading-none mt-0.5 shrink-0">{insight.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <h4 className="font-semibold text-slate-900 text-[14px] leading-tight truncate">{insight.title}</h4>
            <span className={`badge ${severityClass(insight.severity)} shrink-0`}>{insight.severity}</span>
          </div>
          <p className="text-[13px] text-slate-700 leading-relaxed">{insight.observation}</p>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
            <div>
              <div className="section-eyebrow text-[10px] mb-0.5">함의</div>
              <div className="text-slate-600 leading-snug">{insight.implication}</div>
            </div>
            <div>
              <div className="section-eyebrow text-[10px] mb-0.5">권장 액션</div>
              <div className="text-slate-600 leading-snug">{insight.recommended_action}</div>
            </div>
          </div>
          <div className="mt-3 font-mono text-[10px] text-slate-400 tabular tracking-tight truncate">
            ref: metric={insight.ref.metric} · period={insight.ref.period} · n={insight.ref.n}
          </div>
        </div>
      </div>
    </div>
  );
}
