'use client';

import React, { useState } from 'react';
import { Sparkles, Send, HelpCircle, ShieldCheck, ChevronRight, Calculator, CheckCircle2, AlertCircle } from 'lucide-react';
import { AIQuestionResponse } from '@/types';

interface AskAIProps {
  isDemoMode: boolean;
}

const SUGGESTED_QUESTIONS = [
  'Why did net profit turn negative in September 2026?',
  'Which product generated the highest revenue YTD?',
  'Which item has the highest gross margin percentage?',
  'How did marketing expenses change between August and September?',
  'What are our total sales breakdown by sales channel?',
];

export const AskAI: React.FC<AskAIProps> = ({ isDemoMode }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AIQuestionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (questionText: string) => {
    if (!questionText.trim()) return;
    setLoading(true);
    setError(null);
    setQuery(questionText);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionText }),
      });

      if (!res.ok) {
        throw new Error(`Server returned error code ${res.status}`);
      }

      const data: AIQuestionResponse = await res.json();
      setResponse(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-sky-500/20 p-5 md:p-6 backdrop-blur-xl shadow-2xl space-y-6">
      {/* Header & Mode Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Ask Arthik AI
            </h3>
            <p className="text-xs text-slate-400">
              Grounded business insights calculated directly from sales and expense datasets
            </p>
          </div>
        </div>

        {/* Demo Mode Badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            isDemoMode
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{isDemoMode ? 'Demo Mode (Deterministic Data Engine)' : 'Live AI Connected'}</span>
        </div>
      </div>

      {/* Suggested Questions Chips */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
          <HelpCircle className="h-3.5 w-3.5 text-sky-400" />
          Suggested Business Questions:
        </label>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(q)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-sky-600/20 hover:border-sky-500/40 text-slate-300 hover:text-white border border-slate-700 transition-all text-left flex items-center gap-1.5"
            >
              <span>{q}</span>
              <ChevronRight className="h-3 w-3 text-slate-500 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Question Form Input */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleAsk(query);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ask a question about sales, profitability, margins, or expenses..."
          className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              <span>Ask AI</span>
            </>
          )}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Response Box */}
      {response && (
        <div className="mt-4 p-5 rounded-2xl bg-slate-800/60 border border-sky-500/30 space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
            <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Grounded Response
            </h4>
            <span className="text-[10px] text-slate-500">
              Generated at {new Date(response.generatedAt).toLocaleTimeString('en-IN')}
            </span>
          </div>

          {/* Main Answer text */}
          <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-normal">
            {response.answer}
          </div>

          {/* Key Data Points */}
          {response.keyDataPoints && response.keyDataPoints.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              {response.keyDataPoints.map((dp, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-center">
                  <span className="text-[10px] text-slate-400 block">{dp.label}</span>
                  <span className="text-xs font-bold text-white mt-0.5 block">{dp.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Calculation Steps Drawer */}
          {response.calculationSteps && response.calculationSteps.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-700/80 space-y-2">
              <h5 className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Calculator className="h-3.5 w-3.5 text-amber-400" />
                Transparent Calculation Steps & Methodology:
              </h5>
              <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1 pl-1">
                {response.calculationSteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
