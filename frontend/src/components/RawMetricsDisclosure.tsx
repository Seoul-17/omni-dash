'use client';

import { useState } from 'react';

export default function RawMetricsDisclosure({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-[12px] text-slate-600 hover:bg-slate-50/60 transition cursor-pointer"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2">
          <span className="font-mono tabular text-slate-500">SemanticMetrics</span>
          <span className="text-slate-400">— Skills 05 §6.1 출력 계약 원본</span>
        </span>
        <svg
          viewBox="0 0 12 12"
          className={`w-3 h-3 text-slate-500 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none"
        >
          <path d="M4 3L8 6L4 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-slate-200/80 p-4 bg-slate-50/40">
          <pre className="font-mono text-[11px] text-slate-700 leading-relaxed overflow-x-auto tabular">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
