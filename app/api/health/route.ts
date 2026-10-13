import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const checkedAt = new Date().toISOString();
  let database: 'CONNECTED' | 'UNAVAILABLE' = 'UNAVAILABLE';
  let databaseError: string | undefined;

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = 'CONNECTED';
  } catch (error) {
    databaseError = error instanceof Error ? error.message : 'Unknown database error';
  }

  const healthy = database === 'CONNECTED';
  return NextResponse.json(
    {
      success: healthy,
      data: {
        status: healthy ? 'OK' : 'DEGRADED',
        uptimeSeconds: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV ?? 'development',
        database,
        ...(databaseError ? { databaseError: process.env.NODE_ENV === 'development' ? databaseError : 'Database check failed' } : {}),
        checkedAt,
      },
      source: 'system-health',
      timestamp: checkedAt,
    },
    { status: healthy ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
