'use client';

import React from 'react';
import { BusinessInsight } from '@/lib/analytics';
import { ProductPerformance } from '@/types';
import { formatINR, formatPercent } from '@/lib/formatter';
import { Lightbulb, AlertTriangle, TrendingUp, ShieldAlert, Award, ArrowDownRight, CheckCircle2 } from 'lucide-react';

interface BusinessInsightsProps {
  insights: BusinessInsight[];
  topSelling: ProductPerformance[];
  lowPerforming: ProductPerformance[];
}

export const BusinessInsights: React.FC<BusinessInsightsProps> = ({
  insights,
  topSelling,
  lowPerforming,
}) => {
  const getBadgeStyle = (type: BusinessInsight['type']) => {
    switch (type) {
      case 'critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'warning':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'success':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    }
  };

  const getIcon = (type: BusinessInsight['type']) => {
    switch (type) {
      case 'critical':
        return <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />;
      case 'success':
        return <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0" />;
      default:
        return <Lightbulb className="h-4 w-4 text-sky-400 shrink-0" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Actionable AI Recommendations */}
      <div className="lg:col-span-2 rounded-2xl bg-slate-900/80 p-5 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Lightbulb className="h-5 w-5 text-amber-400" />
          <h3 className="text-base font-bold text-white">Business Intelligence & Recommendations</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {insights.map(item => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 transition-all flex flex-col justify-between space-y-2"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeStyle(item.type)}`}>
                    {item.category}
                  </span>
                  {item.metric && <span className="font-mono text-xs font-bold text-white">{item.metric}</span>}
                </div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5 pt-1">
                  {getIcon(item.type)}
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{item.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-700/40 text-[11px] text-sky-300/90 flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Action:</strong> {item.recommendation}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Top Sellers & Low Margin Product Spotlight */}
      <div className="rounded-2xl bg-slate-900/80 p-5 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          {/* Best Sellers */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Award className="h-4 w-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Top 3 Revenue Drivers</h4>
            </div>
            <div className="space-y-1.5">
              {topSelling.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 text-xs">
                  <div className="truncate">
                    <span className="font-semibold text-white truncate block">{idx + 1}. {p.name}</span>
                    <span className="text-[10px] text-slate-400">{p.units} units sold</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-emerald-400 block">{formatINR(p.revenue)}</span>
                    <span className="text-[10px] text-slate-400">{formatPercent(p.margin_pct)} margin</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Margin Warning */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-1.5 pb-1">
              <ArrowDownRight className="h-4 w-4 text-rose-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Margin Compression Risks</h4>
            </div>
            <div className="space-y-1.5">
              {lowPerforming.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-rose-500/5 border border-rose-500/10 text-xs">
                  <div className="truncate">
                    <span className="font-semibold text-slate-200 truncate block">{p.name}</span>
                    <span className="text-[10px] text-slate-400">COGS: {formatINR(p.cogs)}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-rose-400 block">{formatPercent(p.margin_pct)}</span>
                    <span className="text-[10px] text-slate-400">GP: {formatINR(p.gross_profit)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
