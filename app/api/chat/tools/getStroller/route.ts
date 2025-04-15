import { getStroller } from '@/lib/ai/tools/get-stroller';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const questions = await getStroller.execute({});
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error in getStroller API route:', error);
    return new NextResponse('Failed to fetch stroller questions', { status: 500 });
  }
} 