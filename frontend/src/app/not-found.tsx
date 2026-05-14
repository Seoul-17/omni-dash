import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <div className="text-5xl mb-3">🔍</div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">대시보드를 찾을 수 없습니다</h1>
      <p className="text-slate-600 mb-6">세션이 만료되었거나 권한이 없는 포트폴리오일 수 있습니다.</p>
      <Link href="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
        새 CSV 업로드하기
      </Link>
    </div>
  );
}
