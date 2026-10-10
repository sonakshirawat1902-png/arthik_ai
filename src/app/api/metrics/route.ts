import { NextResponse } from 'next/server';
import { getDashboardMetrics } from '@/lib/repository/dbAnalytics';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const summary = await getDashboardMetrics(startDate, endDate);
    return NextResponse.json(summary);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to compute financial metrics', message: error.message },
      { status: 500 }
    );
  }
}
