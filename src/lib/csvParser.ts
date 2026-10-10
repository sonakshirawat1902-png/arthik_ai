import fs from 'fs';
import path from 'path';
import { Product, SaleRecord, ExpenseRecord } from '../types';

export function loadProducts(): Product[] {
  const filePath = path.join(process.cwd(), 'data', 'products.csv');
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length <= 1) return [];

  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const parts = line.split(',');
    return {
      product_id: parts[0],
      name: parts[1],
      category: parts[2],
      list_price: parseFloat(parts[3]) || 0,
      unit_cost: parseFloat(parts[4]) || 0,
    };
  });
}

export function loadSales(): SaleRecord[] {
  const filePath = path.join(process.cwd(), 'data', 'sales.csv');
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length <= 1) return [];

  return lines.slice(1).map(line => {
    const parts = line.split(',');
    return {
      sale_id: parts[0],
      date: parts[1],
      product_id: parts[2],
      quantity: parseInt(parts[3], 10) || 0,
      unit_price: parseFloat(parts[4]) || 0,
      discount_amount: parseFloat(parts[5]) || 0,
      unit_cost_at_sale: parseFloat(parts[6]) || 0,
      channel: parts[7] || 'Store',
    };
  });
}

export function loadExpenses(): ExpenseRecord[] {
  const filePath = path.join(process.cwd(), 'data', 'expenses.csv');
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length <= 1) return [];

  return lines.slice(1).map(line => {
    // Expense lines might contain comma in vendor or note, so basic handling or regex
    const match = line.match(/^([^,]+),([^,]+),([^,]+),([^,]+),([^,]*),(.*)$/);
    if (!match) {
      const parts = line.split(',');
      return {
        expense_id: parts[0],
        date: parts[1],
        category: parts[2],
        amount: parseFloat(parts[3]) || 0,
        vendor: parts[4] || '',
        note: parts[5] || '',
      };
    }
    return {
      expense_id: match[1],
      date: match[2],
      category: match[3],
      amount: parseFloat(match[4]) || 0,
      vendor: match[5],
      note: match[6],
    };
  });
}
