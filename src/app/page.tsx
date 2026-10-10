'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { MetricCard } from '@/components/MetricCard';
import { FinancialCharts } from '@/components/FinancialCharts';
import { ProductsTable } from '@/components/ProductsTable';
import { ExpenseBreakdown } from '@/components/ExpenseBreakdown';
import { AskAI } from '@/components/AskAI';
import { BusinessInsights } from '@/components/BusinessInsights';
import { DatasetValidationBanner } from '@/components/DatasetValidationBanner';
import { VoiceAssistant } from '@/components/VoiceAssistant';
import { InvoiceGenerator } from '@/components/InvoiceGenerator';
import { EnhancedDashboardSummary } from '@/lib/analytics';
import {
  IndianRupee,
  TrendingUp,
  Percent,
  Receipt,
  Calendar,
  RefreshCw,
  AlertCircle,
  LayoutDashboard,
  FileText,
} from 'lucide-react';

const MONTH_OPTIONS = [
  { label: 'Full YTD (Jan - Sep 2026)', start: '', end: '' },
  { label: 'Jan 2026', start: '2026-01-01', end: '2026-01-31' },
  { label: 'Feb 2026', start: '2026-02-01', end: '2026-02-28' },
  { label: 'Mar 2026', start: '2026-03-01', end: '2026-03-31' },
  { label: 'Apr 2026', start: '2026-04-01', end: '2026-04-30' },
  { label: 'May 2026', start: '2026-05-01', end: '2026-05-31' },
  { label: 'Jun 2026', start: '2026-06-01', end: '2026-06-30' },
  { label: 'Jul 2026', start: '2026-07-01', end: '2026-07-31' },
  { label: 'Aug 2026', start: '2026-08-01', end: '2026-08-31' },
  { label: 'Sep 2026 (Festive)', start: '2026-09-01', end: '2026-09-30' },
];

export default function DashboardPage() {
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(0);
  const [data, setData] = useState<EnhancedDashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'invoice'>('dashboard');

  const fetchMetrics = async (start = '', end = '') => {
    setLoading(true);
    setError(null);
    try {
      const url = start && end ? `/api/metrics?startDate=${start}&endDate=${end}` : '/api/metrics';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch analytics data');
      const result: EnhancedDashboardSummary = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const opt = MONTH_OPTIONS[selectedMonthIdx];
    fetchMetrics(opt.start, opt.end);
  }, [selectedMonthIdx]);

  const scrollToSection = (sectionId: string) => {
    setActiveTab('dashboard');
    setTimeout(() => {
      const elem = document.getElementById(sectionId);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navbar */}
      <Header
        businessName={data?.business || 'Rangoli Home & Gifts (Demo)'}
        isDemoMode={true}
        onOpenValidationModal={() => setShowValidationModal(true)}
        onOpenInvoiceGenerator={() => setActiveTab('invoice')}
        onOpenVoiceAssistant={() => {
          // Trigger floating voice assistant modal by dispatching custom click if needed or state
          const btn = document.querySelector('button[title="Open Voice Assistant"]') as HTMLButtonElement;
          if (btn) btn.click();
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Financial Analytics Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('invoice')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'invoice'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>GST Invoice Generator</span>
            </button>
          </div>

          {activeTab === 'dashboard' && (
            <div className="hidden sm:flex items-center gap-2 pr-2">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Quick Jump:</span>
              <button
                onClick={() => scrollToSection('kpi-section')}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Profit KPIs
              </button>
              <button
                onClick={() => scrollToSection('products-section')}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Sales
              </button>
              <button
                onClick={() => scrollToSection('expense-section')}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Expenses
              </button>
            </div>
          )}
        </div>

        {/* View Switcher: Dashboard vs Invoice Generator */}
        {activeTab === 'invoice' ? (
          <InvoiceGenerator onClose={() => setActiveTab('dashboard')} />
        ) : (
          <>
            {/* Top Control Bar: Date Range Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Financial Overview</h2>
                <p className="text-xs text-slate-400">
                  Showing dataset analytics for{' '}
                  <span className="font-semibold text-sky-400">
                    {MONTH_OPTIONS[selectedMonthIdx].label}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Calendar className="h-4 w-4 text-sky-400 shrink-0" />
                <select
                  value={selectedMonthIdx}
                  onChange={e => setSelectedMonthIdx(Number(e.target.value))}
                  className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                >
                  {MONTH_OPTIONS.map((opt, idx) => (
                    <option key={idx} value={idx}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    const opt = MONTH_OPTIONS[selectedMonthIdx];
                    fetchMetrics(opt.start, opt.end);
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
                  title="Refresh Dataset"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
                </button>
              </div>
            </div>

            {/* Dataset Validation Modal Banner Toggle */}
            {showValidationModal && data && (
              <div className="animate-in fade-in duration-200">
                <DatasetValidationBanner
                  salesCount={data.recordCounts.sales}
                  expensesCount={data.recordCounts.expenses}
                  productsCount={data.recordCounts.products}
                />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-6 w-6 text-rose-400" />
                  <div>
                    <h4 className="font-bold text-sm">Failed to load financial data</h4>
                    <p className="text-xs text-rose-400">{error}</p>
                  </div>
                </div>
                <button
                  onClick={() => fetchMetrics()}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-rose-500 hover:bg-rose-600 text-white"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading Skeleton */}
            {loading && !data && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-32 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse p-5 space-y-3">
                    <div className="h-4 w-24 bg-slate-800 rounded" />
                    <div className="h-8 w-36 bg-slate-800 rounded" />
                  </div>
                ))}
              </div>
            )}

            {/* KPI Cards Grid */}
            {data && (
              <>
                <div id="kpi-section" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Net Revenue"
                    value={data.totalRevenue}
                    icon={IndianRupee}
                    variant="primary"
                    subtitle={`From ${data.totalUnits.toLocaleString('en-IN')} units sold`}
                    tooltip="Calculated: sum(quantity * unit_price - discount_amount)"
                  />

                  <MetricCard
                    title="Gross Profit"
                    value={data.totalGrossProfit}
                    icon={TrendingUp}
                    variant="success"
                    subtitle={`Gross Margin: ${data.grossMarginPct.toFixed(2)}%`}
                    tooltip="Calculated: Revenue - COGS"
                  />

                  <MetricCard
                    title="Operating Expenses (OpEx)"
                    value={data.totalOpex}
                    icon={Receipt}
                    variant="warning"
                    subtitle="Rent, Salaries, Marketing & Logistics"
                    tooltip="Calculated: sum of expenses from expenses.csv"
                  />

                  <MetricCard
                    title="Net Profit"
                    value={data.totalNetProfit}
                    icon={Percent}
                    variant={data.totalNetProfit >= 0 ? 'success' : 'danger'}
                    subtitle={`Net Margin: ${data.netMarginPct.toFixed(2)}%`}
                    tooltip="Calculated: Gross Profit - OpEx"
                  />
                </div>

                {/* Financial Visualizations Grid */}
                <FinancialCharts summary={data} />

                {/* Automated Business Intelligence & Recommendations */}
                <BusinessInsights
                  insights={data.insights}
                  topSelling={data.topSellingProducts}
                  lowPerforming={data.lowPerformingProducts}
                />

                {/* Ask AI Grounded Business Assistant */}
                <AskAI isDemoMode={true} />

                {/* Products Performance Table */}
                <div id="products-section">
                  <ProductsTable products={data.productsPerformance} />
                </div>

                {/* Expense Breakdown & MoM Shift */}
                <div id="expense-section">
                  <ExpenseBreakdown
                    categories={data.expenseCategories}
                    sepVsAug={data.sepVsAugExpenses}
                    totalOpex={data.totalOpex}
                  />
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* Floating Voice Assistant */}
      <VoiceAssistant
        onNavigateToInvoice={() => setActiveTab('invoice')}
        onScrollToSection={scrollToSection}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 print:hidden">
        <p>Arthik AI Financial Dashboard • Built for Indian Small Businesses • Rangoli Home & Gifts</p>
      </footer>
    </div>
  );
}
