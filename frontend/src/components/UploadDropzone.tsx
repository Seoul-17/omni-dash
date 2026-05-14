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
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`card border-2 border-dashed cursor-pointer p-12 text-center transition ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
        } ${busy ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="text-4xl mb-3">📊</div>
        {busy ? (
          <p className="text-slate-700">분석 중...</p>
        ) : isDragActive ? (
          <p className="text-blue-700 font-medium">파일을 놓아주세요</p>
        ) : (
          <>
            <p className="font-medium text-slate-700">CSV 파일을 드래그 앤 드롭 하거나 클릭해서 선택</p>
            <p className="text-xs text-slate-500 mt-2">
              지원 입력: 잔고 스냅샷, 거래내역 (Skills 01 §1.1)
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="card p-4 border-red-200 bg-red-50">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="card p-4 border-amber-200 bg-amber-50">
          <p className="text-amber-800 text-sm font-medium mb-1">정규화 경고</p>
          <ul className="text-amber-700 text-xs list-disc list-inside space-y-0.5">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <div className="card p-6">
        <h3 className="font-semibold text-slate-800 mb-4">분석 설정</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Field label="기준 통화" value={cfg.baseCurrency}
                 onChange={(v) => setCfg({ ...cfg, baseCurrency: v })}
                 options={[['KRW', '원'], ['USD', '달러'], ['EUR', '유로'], ['JPY', '엔']]} />
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
    <label className="block">
      <span className="text-xs font-medium text-slate-600 mb-1 block">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-300 rounded-md text-sm py-2 px-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {options.map(([v, lbl]) => (
          <option key={v} value={v}>{lbl}</option>
        ))}
      </select>
    </label>
  );
}
