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
        className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-md bg-white hover:bg-slate-50 disabled:opacity-50"
      >
        {busy ? '재로드 중...' : '🔁 Skills 재로드'}
      </button>
      {msg && <span className="text-xs text-slate-500">{msg}</span>}
    </div>
  );
}
