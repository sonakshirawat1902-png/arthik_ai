'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { formatINR } from '@/lib/formatter';

interface MetricCardProps {
  title: string;
  value: number;
  isCurrency?: boolean;
  isPercentage?: boolean;
  subtitle?: string;
  trendValue?: number;
  trendLabel?: string;
  icon: LucideIcon;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  tooltip?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  isCurrency = true,
  isPercentage = false,
  subtitle,
  trendValue,
  trendLabel,
  icon: Icon,
  variant = 'primary',
  tooltip,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          border: 'border-emerald-500/20',
          badgeBg: 'bg-emerald-500/20 text-emerald-300',
        };
      case 'danger':
        return {
          bg: 'bg-rose-500/10',
          text: 'text-rose-400',
          border: 'border-rose-500/20',
          badgeBg: 'bg-rose-500/20 text-rose-300',
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          border: 'border-amber-500/20',
          badgeBg: 'bg-amber-500/20 text-amber-300',
        };
      case 'neutral':
        return {
          bg: 'bg-slate-800/50',
          text: 'text-slate-300',
          border: 'border-slate-700/50',
          badgeBg: 'bg-slate-700/50 text-slate-300',
        };
      default:
        return {
          bg: 'bg-sky-500/10',
          text: 'text-sky-400',
          border: 'border-sky-500/20',
          badgeBg: 'bg-sky-500/20 text-sky-300',
        };
    }
  };

  const styles = getVariantStyles();

  const formattedValue = isPercentage
    ? `${value.toFixed(2)}%`
    : isCurrency
    ? formatINR(value)
    : value.toLocaleString('en-IN');

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-slate-900/80 p-5 border ${styles.border} backdrop-blur-xl shadow-xl hover:border-slate-700 transition-all group`}
      title={tooltip}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-white">{formattedValue}</h3>
        </div>
        <div className={`p-3 rounded-xl ${styles.bg} ${styles.text} ring-1 ring-white/10 group-hover:scale-110 transition-transform`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {(subtitle || trendValue !== undefined) && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
          {subtitle && <span className="text-slate-400 font-medium">{subtitle}</span>}
          {trendValue !== undefined && (
            <span
              className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded ${
                trendValue >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
              }`}
            >
              {trendValue >= 0 ? '+' : ''}
              {trendValue.toFixed(1)}% {trendLabel && <span className="text-slate-500 font-normal">{trendLabel}</span>}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
