'use client';

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from 'recharts';
import { MonthlyMetric, DashboardSummary } from '@/types';
import { formatCompactINR, formatINR, formatMonthLabel } from '@/lib/formatter';

interface FinancialChartsProps {
  summary: DashboardSummary;
}

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#64748b'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl bg-slate-900/95 p-3.5 border border-slate-800 shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[180px]">
        <p className="font-bold text-slate-200 border-b border-slate-800 pb-1">{formatMonthLabel(label)}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-bold text-white">
              {typeof entry.value === 'number' && entry.name.includes('%')
                ? `${entry.value.toFixed(2)}%`
                : formatINR(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const FinancialCharts: React.FC<FinancialChartsProps> = ({ summary }) => {
  const chartData = summary.monthlyTrends.map(m => ({
    month: m.month,
    label: formatMonthLabel(m.month),
    Revenue: m.rev,
    COGS: m.cogs,
    'Gross Profit': m.gp,
    OpEx: m.opex,
    'Net Profit': m.net,
    'Gross Margin %': m.gm,
    'Net Margin %': m.nm,
  }));

  const expenseData = summary.expenseCategories;
  const channelData = summary.channelBreakdown;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Revenue, COGS, OpEx & Net Profit Overview */}
      <div className="rounded-2xl bg-slate-900/80 p-5 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col justify-between">
        <div className="mb-4">
          <h3 className="text-base font-bold text-white">Revenue, COGS & Profit Trends</h3>
          <p className="text-xs text-slate-400">Monthly breakdown of Net Revenue, Cost of Goods, OpEx, and Net Profit (INR ₹)</p>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="month" tickFormatter={formatMonthLabel} stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={formatCompactINR} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Revenue" fill="#0284c7" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="COGS" fill="#64748b" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="OpEx" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Line type="monotone" dataKey="Net Profit" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Margin Percentages Trend */}
      <div className="rounded-2xl bg-slate-900/80 p-5 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col justify-between">
        <div className="mb-4">
          <h3 className="text-base font-bold text-white">Profit Margins Trajectory (%)</h3>
          <p className="text-xs text-slate-400">Gross Margin % vs Net Margin % month over month</p>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="month" tickFormatter={formatMonthLabel} stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} unit="%" domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="Gross Margin %" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Net Margin %" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Expense Categories Breakdown (Donut) */}
      <div className="rounded-2xl bg-slate-900/80 p-5 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col justify-between">
        <div className="mb-4">
          <h3 className="text-base font-bold text-white">Operating Expense Allocation</h3>
          <p className="text-xs text-slate-400">Distribution of OpEx across operational categories</p>
        </div>
        <div className="h-72 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenseData}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#0f172a" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip formatter={(val: any) => formatINR(val)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Sales Channel Breakdown */}
      <div className="rounded-2xl bg-slate-900/80 p-5 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col justify-between">
        <div className="mb-4">
          <h3 className="text-base font-bold text-white">Sales Channel Mix</h3>
          <p className="text-xs text-slate-400">Net revenue breakdown by sales channel (Store, Online, WhatsApp)</p>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={channelData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={formatCompactINR} />
              <YAxis dataKey="channel" type="category" stroke="#94a3b8" fontSize={11} />
              <Tooltip formatter={(val: any) => formatINR(val)} />
              <Bar dataKey="revenue" fill="#38bdf8" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {channelData.map((entry, index) => (
                  <Cell key={`cell-ch-${index}`} fill={index === 0 ? '#0284c7' : index === 1 ? '#10b981' : '#f59e0b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
