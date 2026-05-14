'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listPortfolios } from '@/lib/api';
import type { PortfolioSummary } from '@/types/dashboard';

export default function PortfolioList() {
  const [items, setItems] = useState<PortfolioSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    listPortfolios()
      .then(setItems)
      .catch((e) => setErr(e?.message || 'failed'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-500">로드 중...</p>;
  if (err) return <p className="text-sm text-slate-400">아직 업로드한 포트폴리오가 없습니다.</p>;
  if (items.length === 0) return <p className="text-sm text-slate-400">업로드 후 여기에 목록이 표시됩니다.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((p) => (
        <Link
          key={p.id}
          href={`/dashboard/${p.id}`}
          className="card group p-4 hover:border-blue-300 hover:shadow-[0_4px_16px_-8px_rgba(15,23,42,0.12)] transition"
        >
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="font-semibold text-slate-900 text-[14px] truncate">{p.name}</div>
            <svg viewBox="0 0 12 12" className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition shrink-0">
              <path d="M3 6H9M9 6L6 3M9 6L6 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div className="font-mono text-[11px] tabular text-slate-400 mb-3">
            {new Date(p.createdAt).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}
          </div>
          <div className="flex flex-wrap gap-1">
            <span className="badge bg-slate-100 text-slate-600 ring-1 ring-slate-200/80">{p.source}</span>
            <span className="badge bg-slate-100 text-slate-600 ring-1 ring-slate-200/80">{p.baseCurrency}</span>
            <span className="badge bg-slate-100 text-slate-600 ring-1 ring-slate-200/80">{p.audience}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
