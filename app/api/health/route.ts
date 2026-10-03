import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      status: 'OK',
      uptime: 0,
      environment: process.env.NODE_ENV ?? 'development',
      time: new Date().toISOString(),
    },
    source: 'system-health',
    timestamp: new Date().toISOString(),
    status: 'CONNECTED',
  });
}
