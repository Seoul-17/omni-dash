import type {
  DashboardOutput,
  PortfolioSummary,
  UploadResponse,
} from '@/types/dashboard';

const PUBLIC_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// 브라우저 fetch 헬퍼 — 익명 세션 쿠키를 자동 전달.
async function jsonFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${PUBLIC_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    let body: any = null;
    try { body = await res.json(); } catch {}
    const msg = body?.message || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export async function uploadCsv(
  file: File,
  options: { baseCurrency?: string; riskProfile?: string; audience?: string; locale?: string; mode?: string } = {}
): Promise<UploadResponse> {
  const form = new FormData();
  form.append('file', file);
  if (options.baseCurrency) form.append('baseCurrency', options.baseCurrency);
  if (options.riskProfile) form.append('riskProfile', options.riskProfile);
  if (options.audience) form.append('audience', options.audience);
  if (options.locale) form.append('locale', options.locale);
  if (options.mode) form.append('mode', options.mode);
  return jsonFetch<UploadResponse>('/api/upload', {
    method: 'POST',
    body: form,
  });
}

/**
 * /public/samples/{filename}에 번들된 CSV를 fetch하여 그대로 업로드 파이프라인에 흘려보낸다.
 * 백엔드 입장에서는 사용자 업로드와 완전히 동일 — 추가 endpoint 불필요.
 */
export async function uploadSample(
  filename: string,
  options: { baseCurrency?: string; riskProfile?: string; audience?: string; locale?: string; mode?: string } = {}
): Promise<UploadResponse> {
  const res = await fetch(`/samples/${filename}`);
  if (!res.ok) throw new Error(`샘플 데이터를 불러올 수 없습니다: ${filename}`);
  const blob = await res.blob();
  const file = new File([blob], filename, { type: 'text/csv' });
  return uploadCsv(file, options);
}

export async function listPortfolios(): Promise<PortfolioSummary[]> {
  return jsonFetch<PortfolioSummary[]>('/api/portfolios');
}

export async function getDashboard(portfolioId: string, mode?: string): Promise<DashboardOutput> {
  const q = mode ? `?mode=${encodeURIComponent(mode)}` : '';
  return jsonFetch<DashboardOutput>(`/api/dashboard/${portfolioId}${q}`);
}

export async function reloadSkills(): Promise<{ version: string; loadedAt: number }> {
  return jsonFetch('/api/skills/reload', { method: 'POST' });
}

export async function ping(): Promise<{ status: string; skillVersion: string }> {
  return jsonFetch('/api/ping');
}
