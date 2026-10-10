'use client';

import React from 'react';
import { TrendingUp, ShieldCheck, Sparkles, Building2, HelpCircle, Receipt } from 'lucide-react';

interface HeaderProps {
  businessName: string;
  isDemoMode: boolean;
  onOpenValidationModal?: () => void;
  onOpenInvoiceGenerator?: () => void;
  onOpenVoiceAssistant?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  businessName,
  isDemoMode,
  onOpenValidationModal,
  onOpenInvoiceGenerator,
  onOpenVoiceAssistant,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Brand Logo & Business Name */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 ring-1 ring-white/20">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-200 bg-clip-text text-transparent">
                Arthik AI
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                v1.0 MVP
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
              <Building2 className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-medium text-slate-300">{businessName}</span>
              <span className="text-slate-600">•</span>
              <span>Jaipur, RJ (INR ₹)</span>
            </div>
          </div>
        </div>

        {/* Status Badges & Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          {/* Invoice Generator Button */}
          {onOpenInvoiceGenerator && (
            <button
              onClick={onOpenInvoiceGenerator}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-colors"
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Invoice Generator</span>
            </button>
          )}

          {/* Voice Assistant Button */}
          {onOpenVoiceAssistant && (
            <button
              onClick={onOpenVoiceAssistant}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white shadow-sm transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Voice Assistant</span>
            </button>
          )}

          {/* Mode Pill */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
              isDemoMode
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
            }`}
          >
            {isDemoMode ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                <span>Demo Mode</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span>Live AI Connected</span>
              </>
            )}
          </div>

          {/* Dataset Info Button */}
          {onOpenValidationModal && (
            <button
              onClick={onOpenValidationModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="View dataset schema & calculation details"
            >
              <HelpCircle className="h-3.5 w-3.5 text-sky-400" />
              <span className="hidden md:inline">Dataset Insights</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
