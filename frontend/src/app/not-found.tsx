import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-28 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-slate-900 text-white mb-5">
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
          <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tightest text-slate-900 mb-2">
        대시보드를 찾을 수 없습니다
      </h1>
      <p className="text-[14px] text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
        세션이 만료되었거나 다른 브라우저에서 생성된 포트폴리오일 수 있습니다.
        새 CSV를 업로드하면 즉시 분석이 시작됩니다.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md text-[13px] font-semibold
                   hover:bg-slate-800 transition shadow-sm"
      >
        새 CSV 업로드하기
        <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none">
          <path d="M3 6H9M9 6L6 3M9 6L6 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </div>
  );
}
