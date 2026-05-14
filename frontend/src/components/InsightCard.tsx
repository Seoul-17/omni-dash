import type { Insight } from '@/types/dashboard';
import { severityClass } from '@/lib/format';

export default function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div className="text-2xl leading-none mt-0.5">{insight.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="font-semibold text-slate-800 truncate">{insight.title}</h4>
            <span className={`badge ${severityClass(insight.severity)} shrink-0`}>{insight.severity}</span>
          </div>
          <p className="text-sm text-slate-600 mt-1">{insight.observation}</p>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-slate-500 font-medium">함의</div>
              <div className="text-slate-700">{insight.implication}</div>
            </div>
            <div>
              <div className="text-slate-500 font-medium">권장 액션</div>
              <div className="text-slate-700">{insight.recommended_action}</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            [ref: metric={insight.ref.metric}, period={insight.ref.period}, n={insight.ref.n}]
          </div>
        </div>
      </div>
    </div>
  );
}
