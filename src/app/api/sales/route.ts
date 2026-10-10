import { NextResponse } from 'next/server';
import { loadSales } from '@/lib/csvParser';
import { z } from 'zod';

const SaleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  product_id: z.string().min(1),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
  discount_amount: z.number().nonnegative(),
  unit_cost_at_sale: z.number().nonnegative(),
  channel: z.enum(['Store', 'Online', 'WhatsApp']),
});

export async function GET() {
  try {
    const sales = loadSales();
    return NextResponse.json({ success: true, count: sales.length, sales: sales.slice(0, 100) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = SaleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid sale transaction schema', details: validation.error.format() },
        { status: 400 }
      );
    }

    const newSale = validation.data;
    return NextResponse.json({
      success: true,
      message: 'Sale transaction validated successfully.',
      sale: newSale,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
