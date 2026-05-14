'use client';

import type { ReactElement } from 'react';
import {
  ResponsiveContainer,
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  Treemap,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import type { ChartSpec } from '@/types/dashboard';

// Skills 03 §3.2 색상 거버넌스 — 의미별 단일 매핑.
// 자산 색상은 모노톤 → 강조색 그라데이션 (전문 BI 도구 style)
const ASSET_PALETTE = [
  '#0f172a', // slate-900
  '#2563eb', // blue-600  (주축)
  '#0d9488', // teal-600
  '#7c3aed', // violet-600
  '#c2410c', // orange-700
  '#0891b2', // cyan-600
  '#a16207', // yellow-700
  '#be123c', // rose-700
  '#1e7d4d', // green-700
  '#475569', // slate-600
];

// 의미별 색상 — semantic
const SEMANTIC = {
  benchmark: '#94a3b8', // slate-400, 점선 처리
  portfolio: '#2563eb',
  loss: '#dc2626',      // red-600
  lossFill: '#fee2e2',  // red-100
  gain: '#059669',      // emerald-600
  neutral: '#64748b',   // slate-500
};

const AXIS_TICK = { fontSize: 11, fill: '#64748b' };
const GRID_STROKE = '#e2e8f0';

const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'rgba(255, 255, 255, 0.96)',
    border: '1px solid rgb(226, 232, 240)',
    borderRadius: '6px',
    fontSize: '12px',
    fontFamily: 'var(--font-mono), JetBrains Mono, monospace',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
  },
  labelStyle: { color: '#64748b', fontSize: '11px', marginBottom: '4px', fontFamily: 'Pretendard Variable, Pretendard, sans-serif' },
  itemStyle: { color: '#0f172a' },
};

const LEGEND_STYLE = { fontSize: '11px', paddingTop: '8px' };

function multiLineRows(spec: ChartSpec) {
  const series = spec.data.series || ['value'];
  const xs = spec.data.x as (string | number)[];
  const ys = Array.isArray(spec.data.y[0]) ? (spec.data.y as (number | string)[][]) : [spec.data.y as (number | string)[]];
  return xs.map((x, i) => {
    const row: Record<string, any> = { x };
    series.forEach((name, sIdx) => {
      const arr = ys[sIdx] as (number | string)[] | undefined;
      row[name] = arr ? arr[i] : null;
    });
    return row;
  });
}

function singleSeriesRows(spec: ChartSpec) {
  const xs = spec.data.x as (string | number)[];
  const ys = (Array.isArray(spec.data.y[0]) ? spec.data.y[0] : spec.data.y) as (number | string)[];
  return xs.map((x, i) => ({ x, y: ys[i] }));
}

function pieRows(spec: ChartSpec) {
  const labels = spec.data.x as (string | number)[];
  const values = (Array.isArray(spec.data.y[0]) ? spec.data.y[0] : spec.data.y) as number[];
  return labels.map((name, i) => ({ name: String(name), value: values[i] }));
}

function formatPct(v: any) {
  if (typeof v !== 'number') return v;
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

export default function ChartRenderer({ spec }: { spec: ChartSpec }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 text-[14px] leading-tight truncate">{spec.title}</h3>
          {spec.encoding?.x_axis?.label && (
            <p className="mt-0.5 text-[11px] text-slate-400">
              x: {spec.encoding.x_axis.label}{spec.encoding.y_axis?.label ? ` · y: ${spec.encoding.y_axis.label}` : ''}
            </p>
          )}
        </div>
        <span className="font-mono text-[10px] tracking-tracked-up uppercase text-slate-400 shrink-0">
          {spec.type.replace('_', ' ')}
        </span>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart(spec)}
        </ResponsiveContainer>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono tabular">
        <span className="truncate">{spec.source}</span>
        {spec.caveat && <span className="text-amber-600">⚠ {spec.caveat}</span>}
      </div>
    </div>
  );
}

function renderChart(spec: ChartSpec): ReactElement {
  switch (spec.type) {
    case 'multi_line': {
      const rows = multiLineRows(spec);
      const series = spec.data.series || ['value'];
      // 벤치마크 시리즈는 회색 점선
      return (
        <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="x" tick={AXIS_TICK} minTickGap={56} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={48}
                 tickFormatter={(v) => `${v}%`} />
          <Tooltip {...TOOLTIP_STYLE} formatter={formatPct} />
          <Legend wrapperStyle={LEGEND_STYLE} iconType="line" />
          {series.map((name, i) => {
            const isBench = /KODEX|SPY|ACWI|STOXX|bench/i.test(name);
            return (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={isBench ? SEMANTIC.benchmark : ASSET_PALETTE[i % ASSET_PALETTE.length]}
                strokeDasharray={isBench ? '4 4' : undefined}
                strokeWidth={isBench ? 1.5 : 2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            );
          })}
        </LineChart>
      );
    }
    case 'line': {
      const rows = singleSeriesRows(spec);
      return (
        <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="x" tick={AXIS_TICK} minTickGap={56} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={48} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Line type="monotone" dataKey="y" stroke={SEMANTIC.portfolio} dot={false} strokeWidth={2} />
        </LineChart>
      );
    }
    case 'underwater': {
      const rows = singleSeriesRows(spec);
      return (
        <AreaChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="ddGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SEMANTIC.loss} stopOpacity={0.18} />
              <stop offset="100%" stopColor={SEMANTIC.loss} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="x" tick={AXIS_TICK} minTickGap={56} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={48}
                 tickFormatter={(v) => `${v}%`} />
          <Tooltip {...TOOLTIP_STYLE} formatter={formatPct} />
          <Area type="monotone" dataKey="y" stroke={SEMANTIC.loss} strokeWidth={1.5} fill="url(#ddGradient)" />
        </AreaChart>
      );
    }
    case 'donut': {
      const rows = pieRows(spec);
      const total = rows.reduce((s, r) => s + (r.value || 0), 0);
      return (
        <PieChart>
          <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => `${v.toFixed(2)}%`} />
          <Legend wrapperStyle={LEGEND_STYLE} iconType="circle" />
          <Pie
            data={rows}
            dataKey="value"
            nameKey="name"
            innerRadius={58}
            outerRadius={92}
            paddingAngle={1}
            stroke="#fff"
            strokeWidth={1.5}
            label={(d: any) => d.value > 5 ? `${d.value.toFixed(0)}%` : ''}
            labelLine={false}
          >
            {rows.map((_, i) => (
              <Cell key={i} fill={ASSET_PALETTE[i % ASSET_PALETTE.length]} />
            ))}
          </Pie>
        </PieChart>
      );
    }
    case 'treemap': {
      const rows = pieRows(spec).map((r, i) => ({ ...r, fill: ASSET_PALETTE[i % ASSET_PALETTE.length] }));
      return <Treemap data={rows} dataKey="value" nameKey="name" stroke="#fff" content={<TreemapCell />} />;
    }
    case 'horizontal_bar': {
      const rows = singleSeriesRows(spec);
      return (
        <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 16, left: 40, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={GRID_STROKE} horizontal={false} />
          <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false}
                 tickFormatter={(v) => `${v}%`} />
          <YAxis type="category" dataKey="x" tick={AXIS_TICK} axisLine={false} tickLine={false} width={80} />
          <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => `${v.toFixed(2)}%`} />
          <Bar dataKey="y" fill={SEMANTIC.portfolio} radius={[0, 3, 3, 0]} maxBarSize={20} />
        </BarChart>
      );
    }
    case 'histogram_box': {
      const rows = singleSeriesRows(spec);
      return (
        <BarChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="x" tick={AXIS_TICK} axisLine={false} tickLine={false}
                 tickFormatter={(v) => `${v}%`} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={36} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Bar dataKey="y" radius={[2, 2, 0, 0]} maxBarSize={24}>
            {rows.map((r, i) => (
              <Cell key={i} fill={(r.x as number) < 0 ? SEMANTIC.loss : SEMANTIC.gain} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      );
    }
    default: {
      const rows = singleSeriesRows(spec);
      return (
        <LineChart data={rows}>
          <Line dataKey="y" stroke={SEMANTIC.portfolio} />
          <XAxis dataKey="x" />
          <YAxis />
          <Tooltip {...TOOLTIP_STYLE} />
        </LineChart>
      );
    }
  }
}

// 트리맵 셀: 라벨이 안에 보이게
function TreemapCell(props: any) {
  const { x, y, width, height, name, value, fill } = props;
  if (width < 40 || height < 24) return <rect x={x} y={y} width={width} height={height} fill={fill} stroke="#fff" />;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke="#fff" strokeWidth={1.5} />
      <text x={x + 8} y={y + 16} fill="#fff" fontSize={11} fontWeight={600} style={{fontFamily:'Pretendard Variable, sans-serif'}}>
        {name}
      </text>
      <text x={x + 8} y={y + 32} fill="rgba(255,255,255,0.85)" fontSize={11} style={{fontVariantNumeric:'tabular-nums', fontFamily:'JetBrains Mono, monospace'}}>
        {value?.toFixed(1)}%
      </text>
    </g>
  );
}
