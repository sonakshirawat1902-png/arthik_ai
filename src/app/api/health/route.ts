import { NextResponse } from 'next/server';
import { checkGeminiHealth } from '@/lib/gemini';

export async function GET() {
  try {
    const geminiHealth = await checkGeminiHealth();

    // Check Database connection state safely (without revealing connection strings or passwords)
    const dbConfigured = Boolean(
      (process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0) ||
      (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-ref'))
    );

    const dbHealth = {
      status: dbConfigured ? 'configured' : 'fallback_demo_dataset',
      message: dbConfigured
        ? 'Database connection parameters detected in environment.'
        : 'Running on local verified dataset repository engine (data/sales.csv).',
    };

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        gemini: geminiHealth,
        database: dbHealth,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', error: error.message },
      { status: 500 }
    );
  }
}
