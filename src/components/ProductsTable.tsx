'use client';

import React, { useState, useMemo } from 'react';
import { ProductPerformance } from '@/types';
import { formatINR, formatPercent } from '@/lib/formatter';
import { Search, ArrowUpDown, Package, Sparkles } from 'lucide-react';

interface ProductsTableProps {
  products: ProductPerformance[];
}

export const ProductsTable: React.FC<ProductsTableProps> = ({ products }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof ProductPerformance>('gross_profit');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category));
    return ['ALL', ...Array.from(set).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          valA = (valA as string).toLowerCase();
          valB = (valB as string).toLowerCase();
        }
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [products, searchTerm, selectedCategory, sortField, sortDirection]);

  const handleSort = (field: keyof ProductPerformance) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getMarginBadge = (margin: number) => {
    if (margin >= 50) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    if (margin >= 35) {
      return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    }
    if (margin >= 25) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
    return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  };

  return (
    <div className="rounded-2xl bg-slate-900/80 p-5 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-sky-400" />
            <h3 className="text-base font-bold text-white">Product Performance & Profitability</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Calculated metrics per product item: Units Sold, Revenue, COGS, Gross Profit, and Gross Margin %
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search product..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('id')}>
                <div className="flex items-center gap-1">
                  ID & Product
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-4 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('category')}>
                Category
              </th>
              <th className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-white" onClick={() => handleSort('units')}>
                Units Sold
              </th>
              <th className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-white" onClick={() => handleSort('revenue')}>
                Net Revenue
              </th>
              <th className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-white" onClick={() => handleSort('cogs')}>
                COGS
              </th>
              <th className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-white" onClick={() => handleSort('gross_profit')}>
                Gross Profit
              </th>
              <th className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-white" onClick={() => handleSort('margin_pct')}>
                Margin %
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                  No products found matching your search.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{p.name}</div>
                    <div className="text-[10px] text-slate-500">{p.id}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                      {p.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-200">{p.units.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-right font-medium text-white">{formatINR(p.revenue)}</td>
                  <td className="py-3 px-4 text-right text-slate-400">{formatINR(p.cogs)}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-400">{formatINR(p.gross_profit)}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full font-semibold text-[11px] border ${getMarginBadge(p.margin_pct)}`}>
                      {formatPercent(p.margin_pct)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
