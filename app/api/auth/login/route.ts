import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    success: false,
    data: null,
    status: 'UNAVAILABLE_FROM_SOURCE',
    error: 'Authentication source not configured',
  });
}
