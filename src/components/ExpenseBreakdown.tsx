'use client';

import React from 'react';
import { ExpenseCategoryDiff } from '@/types';
import { formatINR } from '@/lib/formatter';
import { Receipt, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ExpenseBreakdownProps {
  categories: { category: string; amount: number; percentage: number }[];
  sepVsAug: ExpenseCategoryDiff[];
  totalOpex: number;
}

export const ExpenseBreakdown: React.FC<ExpenseBreakdownProps> = ({
  categories,
  sepVsAug,
  totalOpex,
}) => {
  const diffMap = new Map(sepVsAug.map(d => [d.category, d]));

  return (
    <div className="rounded-2xl bg-slate-900/80 p-5 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Expense Breakdown & MoM Shift</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Category wise operating expenses with September vs August variance analysis
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">Total OpEx</span>
          <p className="text-lg font-bold text-amber-400">{formatINR(totalOpex)}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 font-semibold">Expense Category</th>
              <th className="py-3 px-4 font-semibold text-right">Total Amount</th>
              <th className="py-3 px-4 font-semibold text-right">% of OpEx</th>
              <th className="py-3 px-4 font-semibold text-right">Aug 2026</th>
              <th className="py-3 px-4 font-semibold text-right">Sep 2026</th>
              <th className="py-3 px-4 font-semibold text-right">MoM Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {categories.map(c => {
              const diff = diffMap.get(c.category);
              const change = diff ? diff.change : 0;
              const aug = diff ? diff.aug : 0;
              const sep = diff ? diff.sep : 0;

              return (
                <tr key={c.category} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">{c.category}</td>
                  <td className="py-3 px-4 text-right font-medium text-white">{formatINR(c.amount)}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-amber-400 h-1.5 rounded-full"
                          style={{ width: `${Math.min(c.percentage, 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-300">{c.percentage.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400">{formatINR(aug)}</td>
                  <td className="py-3 px-4 text-right text-slate-300 font-medium">{formatINR(sep)}</td>
                  <td className="py-3 px-4 text-right">
                    {change > 0 ? (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-medium bg-rose-500/10 px-2 py-0.5 rounded">
                        <TrendingUp className="h-3 w-3" />
                        +{formatINR(change)}
                      </span>
                    ) : change < 0 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded">
                        <TrendingDown className="h-3 w-3" />
                        {formatINR(change)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400 font-medium px-2 py-0.5">
                        <Minus className="h-3 w-3" />
                        ₹0
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
