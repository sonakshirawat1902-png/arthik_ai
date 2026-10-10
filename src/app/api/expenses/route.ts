import { NextResponse } from 'next/server';
import { loadExpenses } from '@/lib/csvParser';
import { z } from 'zod';

const ExpenseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.string().min(1),
  amount: z.number().positive(),
  vendor: z.string().optional(),
  note: z.string().optional(),
});

export async function GET() {
  try {
    const expenses = loadExpenses();
    return NextResponse.json({ success: true, count: expenses.length, expenses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = ExpenseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid expense schema', details: validation.error.format() },
        { status: 400 }
      );
    }

    const newExpense = validation.data;
    return NextResponse.json({
      success: true,
      message: 'Expense entry validated successfully.',
      expense: newExpense,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
