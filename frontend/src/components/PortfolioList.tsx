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
          className="card p-4 hover:border-blue-400 hover:shadow-md transition"
        >
          <div className="font-medium text-slate-800 truncate">{p.name}</div>
          <div className="text-xs text-slate-500 mt-1">
            {new Date(p.createdAt).toLocaleString('ko-KR')}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex gap-2">
            <span className="badge bg-slate-100 text-slate-600">{p.source}</span>
            <span className="badge bg-slate-100 text-slate-600">{p.baseCurrency}</span>
            <span className="badge bg-slate-100 text-slate-600">{p.audience}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
