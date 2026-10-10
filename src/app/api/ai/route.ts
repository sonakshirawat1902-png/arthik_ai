import { NextResponse } from 'next/server';
import { answerBusinessQuestionAsync } from '@/lib/aiEngine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question string is required' }, { status: 400 });
    }

    const response = await answerBusinessQuestionAsync(question);
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to process AI question', message: error.message },
      { status: 500 }
    );
  }
}
