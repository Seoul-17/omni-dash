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

const PALETTE = [
  '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#14b8a6',
];

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

export default function ChartRenderer({ spec }: { spec: ChartSpec }) {
  const title = spec.title;

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-medium text-slate-800 text-sm">{title}</h3>
        <span className="text-xs text-slate-400">{spec.type}</span>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart(spec)}
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-xs text-slate-400">{spec.source}{spec.caveat ? ` · ${spec.caveat}` : ''}</div>
    </div>
  );
}

function renderChart(spec: ChartSpec): ReactElement {
  switch (spec.type) {
    case 'multi_line': {
      const rows = multiLineRows(spec);
      const series = spec.data.series || ['value'];
      return (
        <LineChart data={rows} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="x" tick={{ fontSize: 11 }} minTickGap={48} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          {series.map((name, i) => (
            <Line key={name} type="monotone" dataKey={name} stroke={PALETTE[i % PALETTE.length]}
                  dot={false} strokeWidth={2} />
          ))}
        </LineChart>
      );
    }
    case 'line': {
      const rows = singleSeriesRows(spec);
      return (
        <LineChart data={rows} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="x" tick={{ fontSize: 11 }} minTickGap={48} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey="y" stroke="#2563eb" dot={false} strokeWidth={2} />
        </LineChart>
      );
    }
    case 'underwater': {
      const rows = singleSeriesRows(spec);
      return (
        <AreaChart data={rows} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="x" tick={{ fontSize: 11 }} minTickGap={48} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Area type="monotone" dataKey="y" stroke="#dc2626" fill="#fecaca" />
        </AreaChart>
      );
    }
    case 'donut': {
      const rows = pieRows(spec);
      return (
        <PieChart>
          <Tooltip />
          <Legend />
          <Pie data={rows} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
            {rows.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
        </PieChart>
      );
    }
    case 'treemap': {
      const rows = pieRows(spec);
      return <Treemap data={rows} dataKey="value" nameKey="name" stroke="#fff" fill="#2563eb" />;
    }
    case 'horizontal_bar': {
      const rows = singleSeriesRows(spec);
      return (
        <BarChart data={rows} layout="vertical" margin={{ top: 10, right: 16, left: 40, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="x" tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="y" fill="#2563eb" />
        </BarChart>
      );
    }
    case 'histogram_box': {
      const rows = singleSeriesRows(spec);
      return (
        <BarChart data={rows} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="x" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="y" fill="#10b981" />
        </BarChart>
      );
    }
    default: {
      const rows = singleSeriesRows(spec);
      return (
        <LineChart data={rows}>
          <Line dataKey="y" stroke="#2563eb" />
          <XAxis dataKey="x" />
          <YAxis />
          <Tooltip />
        </LineChart>
      );
    }
  }
}
