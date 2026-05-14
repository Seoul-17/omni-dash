'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { uploadCsv } from '@/lib/api';

type Config = {
  baseCurrency: string;
  riskProfile: string;
  audience: string;
  locale: string;
  mode: string;
};

const DEFAULT_CONFIG: Config = {
  baseCurrency: 'KRW',
  riskProfile: 'moderate',
  audience: 'intermediate',
  locale: 'ko-KR',
  mode: 'standard',
};

export default function UploadDropzone() {
  const router = useRouter();
  const [cfg, setCfg] = useState<Config>(DEFAULT_CONFIG);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const onDrop = useCallback(async (files: File[]) => {
    setError(null);
    setWarnings([]);
    if (files.length === 0) return;
    const file = files[0];
    setBusy(true);
    try {
      const res = await uploadCsv(file, cfg);
      if (res.warnings && res.warnings.length > 0) setWarnings(res.warnings);
      router.push(`/dashboard/${res.portfolioId}?mode=${cfg.mode}`);
    } catch (e: any) {
      setError(e?.message || '업로드 실패');
    } finally {
      setBusy(false);
    }
  }, [cfg, router]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.csv'] },
    disabled: busy,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={[
          'card-elevated relative cursor-pointer transition group',
          'border-2 border-dashed p-10 text-center',
          isDragActive
            ? 'border-blue-500 bg-blue-50/40'
            : 'border-slate-300/80 hover:border-slate-400 hover:bg-slate-50/40',
          busy ? 'opacity-60 pointer-events-none' : '',
        ].join(' ')}
      >
        <input {...getInputProps()} />
        {/* 차트 글리프 아이콘 — 이모지 대신 SVG */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-slate-900 text-white mb-3 group-hover:scale-105 transition">
          {busy ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
              <path d="M4 19V11M9 19V5M14 19V8M19 19V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M3 22H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </div>
        {busy ? (
          <p className="text-slate-900 font-semibold text-[15px]">분석 중...</p>
        ) : isDragActive ? (
          <p className="text-blue-700 font-semibold text-[15px]">파일을 놓으세요</p>
        ) : (
          <>
            <p className="font-semibold text-slate-900 text-[15px]">
              CSV를 끌어다 놓거나 클릭해서 선택
            </p>
            <p className="text-[12px] text-slate-500 mt-1.5 font-mono tabular">
              잔고 스냅샷 · 거래내역 · 최대 10MB
            </p>
            <p className="text-[12px] text-slate-500 mt-3">
              CSV가 없나요?{' '}
              <a
                href="#sample-showcase"
                onClick={(e) => e.stopPropagation()}
                className="text-blue-600 hover:text-blue-700 font-medium underline-offset-2 hover:underline"
              >
                샘플 데이터로 둘러보기 ↓
              </a>
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="card border-l-2 border-l-red-500 p-3 flex items-start gap-2">
          <span className="text-red-600 mt-0.5 shrink-0">⚠</span>
          <p className="text-red-700 text-[13px] font-medium">{error}</p>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="card border-l-2 border-l-amber-500 p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="badge badge-warn">정규화 경고</span>
          </div>
          <ul className="text-amber-800 text-[12px] space-y-0.5 leading-snug ml-1">
            {warnings.map((w, i) => <li key={i} className="font-mono">· {w}</li>)}
          </ul>
        </div>
      )}

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 text-[14px]">분석 설정</h3>
          <span className="font-mono text-[10px] tabular text-slate-400">analysis_config</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Field label="기준 통화" value={cfg.baseCurrency}
                 onChange={(v) => setCfg({ ...cfg, baseCurrency: v })}
                 options={[['KRW', '원 (KRW)'], ['USD', '달러 (USD)'], ['EUR', '유로 (EUR)'], ['JPY', '엔 (JPY)']]} />
          <Field label="위험 프로파일" value={cfg.riskProfile}
                 onChange={(v) => setCfg({ ...cfg, riskProfile: v })}
                 options={[['conservative', '보수적'], ['moderate', '중립'], ['aggressive', '공격적']]} />
          <Field label="대상 청자" value={cfg.audience}
                 onChange={(v) => setCfg({ ...cfg, audience: v })}
                 options={[['novice', '초보'], ['intermediate', '중급'], ['expert', '전문가']]} />
          <Field label="언어" value={cfg.locale}
                 onChange={(v) => setCfg({ ...cfg, locale: v })}
                 options={[['ko-KR', '한국어'], ['en-US', 'English']]} />
          <Field label="출력 모드" value={cfg.mode}
                 onChange={(v) => setCfg({ ...cfg, mode: v })}
                 options={[['quick', 'Quick'], ['standard', 'Standard'], ['full', 'Full']]} />
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: [string, string][]; }) {
  return (
    <label className="block cursor-pointer">
      <span className="section-eyebrow block mb-1.5">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-[13px] py-2 px-3 bg-white border border-slate-300/80 rounded-md
                   font-medium text-slate-900
                   focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500
                   hover:border-slate-400 transition cursor-pointer"
      >
        {options.map(([v, lbl]) => (
          <option key={v} value={v}>{lbl}</option>
        ))}
      </select>
    </label>
  );
}
