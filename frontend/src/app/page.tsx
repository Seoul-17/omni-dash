import UploadDropzone from '@/components/UploadDropzone';
import PortfolioList from '@/components/PortfolioList';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <section className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          금융 데이터 한 번에 — <span className="text-blue-600">대시보드 자동 생성</span>
        </h1>
        <p className="text-slate-600">
          CSV 파일을 업로드하면 Skills.md(v3.0.0)의 검증된 분석 규칙으로 즉시 시각화·인사이트를 만듭니다.
        </p>
      </section>

      <UploadDropzone />

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">최근 업로드</h2>
        <PortfolioList />
      </section>

      <section className="mt-12 text-sm text-slate-600 space-y-2">
        <h3 className="font-semibold text-slate-700">지원 입력 예시</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>한국어 헤더 잔고 CSV: <code className="bg-slate-100 px-1 rounded">종목코드, 종목명, 수량, 평단가</code></li>
          <li>영문 헤더 ETF: <code className="bg-slate-100 px-1 rounded">asset_id, asset_class, quantity, avg_cost</code></li>
          <li>거래내역: <code className="bg-slate-100 px-1 rounded">side(buy/sell), price, fees, executed_at</code></li>
          <li>양식이 엉망인 입력도 OK — Skills 01 §1.4 자동 어댑터가 매핑합니다.</li>
        </ul>
      </section>
    </div>
  );
}
