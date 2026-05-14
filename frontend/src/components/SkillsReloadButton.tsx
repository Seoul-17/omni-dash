'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { reloadSkills } from '@/lib/api';

/**
 * 시연 3 — Skills.md(thresholds.yml) 수정 후 이 버튼을 누르면 임계값이 즉시 재로드되고,
 * 페이지를 새로고침해 새로운 임계 기반 인사이트와 색상이 반영된다.
 */
export default function SkillsReloadButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = async () => {
    setBusy(true); setMsg(null);
    try {
      const res = await reloadSkills();
      setMsg(`✓ Skills v${res.version} 재로드됨`);
      // 캐시가 무효화되었으므로 페이지를 다시 호출
      setTimeout(() => router.refresh(), 400);
    } catch (e: any) {
      setMsg(`✗ ${e?.message || '재로드 실패'}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={reload}
        disabled={busy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium
                   border border-slate-300 rounded-md bg-white text-slate-700
                   hover:bg-slate-50 hover:border-slate-400
                   focus:outline-none focus:ring-2 focus:ring-blue-500/40
                   disabled:opacity-50 transition cursor-pointer"
        title="thresholds.yml 외부 파일을 재로드하고 캐시 무효화"
      >
        <svg
          viewBox="0 0 12 12" fill="none"
          className={`w-3 h-3 ${busy ? 'animate-spin' : ''}`}
        >
          <path d="M10 6C10 8.21 8.21 10 6 10C3.79 10 2 8.21 2 6C2 3.79 3.79 2 6 2C7.5 2 8.8 2.83 9.5 4M10 2V4H8"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {busy ? 'Reload…' : 'Skills 재로드'}
      </button>
      {msg && <span className="font-mono text-[11px] tabular text-slate-500">{msg}</span>}
    </div>
  );
}
