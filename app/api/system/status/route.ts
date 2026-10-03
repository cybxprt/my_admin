import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      app: 'MY_ADMIN',
      mode: process.env.NODE_ENV ?? 'development',
      status: 'READY',
      checks: {
        database: 'UNAVAILABLE FROM SOURCE',
        router: 'UNAVAILABLE FROM SOURCE',
        adb: 'ADB SOURCE UNAVAILABLE',
        telegram: 'UNAVAILABLE FROM SOURCE',
      },
    },
    source: 'system-status',
    timestamp: new Date().toISOString(),
    status: 'CONNECTED',
  });
}
