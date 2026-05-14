// 숫자/통화/날짜 포맷팅 헬퍼.

export function formatPercent(v: number, digits = 2): string {
  if (Number.isNaN(v)) return '–';
  return `${v.toFixed(digits)}%`;
}

export function formatNumber(v: number, digits = 2): string {
  if (Number.isNaN(v)) return '–';
  return v.toLocaleString('ko-KR', { maximumFractionDigits: digits });
}

export function formatScore(v: number): string {
  return v.toFixed(2);
}

export function formatKpiValue(value: number, unit: string): string {
  switch (unit) {
    case '%': return formatPercent(value);
    case 'x': return `${value.toFixed(2)}x`;
    case 'currency': return formatNumber(value, 0);
    case 'days': return `${Math.round(value)}일`;
    case 'score':
    default: return formatScore(value);
  }
}

export function severityClass(severity?: string | null): string {
  switch (severity) {
    case 'critical': return 'badge-critical';
    case 'warn': return 'badge-warn';
    default: return 'badge-info';
  }
}

export function valueDirectionClass(d: string): string {
  switch (d) {
    case 'positive': return 'text-emerald-600';
    case 'negative': return 'text-red-600';
    default: return 'text-slate-700';
  }
}
