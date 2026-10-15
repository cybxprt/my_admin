import { timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const clientSchema = z.object({
  index: z.number().int().positive().max(1000),
  name: z.string().min(1).max(80),
  ip: z.string().max(45),
  connectionType: z.string().max(20),
  downloadMbps: z.number().finite().nullable(),
  uploadMbps: z.number().finite().nullable(),
  accessAllowed: z.boolean(),
});

const snapshotSchema = z.object({
  schemaVersion: z.literal(1),
  source: z.literal('tenda-v12-readonly'),
  router: z.object({
    name: z.string().min(1).max(80),
    address: z.string().max(45),
    firmware: z.string().max(80).nullable(),
    lanIp: z.string().max(45).nullable(),
    wanType: z.string().max(30).nullable(),
    wanStatusCode: z.string().max(40).nullable(),
    wanAddressClass: z.enum(['UNAVAILABLE', 'INVALID_SOURCE_VALUE', 'PRIVATE_OR_UPSTREAM_NAT_POSSIBLE', 'GLOBAL', 'SPECIAL_USE']),
    wanGateway: z.string().max(45).nullable(),
    dnsServers: z.array(z.string().max(45)).max(4),
  }),
  summary: z.object({
    reportedOnlineCount: z.number().finite().nullable(),
    observedClientCount: z.number().int().nonnegative().max(1000),
    blacklistCount: z.number().int().nonnegative().max(1000),
    wifiSignalDbm: z.number().finite().nullable(),
  }),
  clients: z.array(clientSchema).max(1000),
  provenance: z.record(z.string().max(80)),
  observedAt: z.string().datetime({ offset: true }),
});

function authorized(request: NextRequest): boolean {
  const expected = process.env.NETWORK_AGENT_TOKEN;
  const provided = request.headers.get('x-network-agent-token');
  if (!expected || !provided) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(provided);
  return left.length === right.length && timingSafeEqual(left, right);
}

function isPrivateIpv4(value: string): boolean {
  if (isIP(value) !== 4) return false;
  const [a, b] = value.split('.').map(Number);
  return a === 10 || a === 192 && b === 168 || a === 172 && b >= 16 && b <= 31 || a === 100 && b >= 64 && b <= 127;
}

export async function POST(request: NextRequest) {
  if (!process.env.NETWORK_AGENT_TOKEN) {
    return NextResponse.json({ success: false, error: 'NETWORK_AGENT_TOKEN is not configured' }, { status: 503 });
  }
  if (!authorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized agent' }, { status: 401 });
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, 'utf8') > 128 * 1024) {
    return NextResponse.json({ success: false, error: 'Payload exceeds 128 KB limit' }, { status: 413 });
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(raw);
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
  }
  const validation = snapshotSchema.safeParse(parsedBody);
  if (!validation.success) {
    return NextResponse.json({ success: false, error: 'Invalid snapshot schema', issues: validation.error.issues.map(({ path, message }) => ({ path, message })) }, { status: 400 });
  }

  const snapshot = validation.data;
  if (!isPrivateIpv4(snapshot.router.address) || snapshot.router.address !== snapshot.router.lanIp) {
    return NextResponse.json({ success: false, error: 'Router address must match a private IPv4 LAN address' }, { status: 400 });
  }
  if (snapshot.summary.observedClientCount !== snapshot.clients.length) {
    return NextResponse.json({ success: false, error: 'Observed client count does not match client records' }, { status: 400 });
  }

  const checkedAt = new Date(snapshot.observedAt);
  try {
    const previousRouter = await prisma.router.findUnique({
      where: { name: snapshot.router.name },
      select: { id: true, status: true },
    });
    if (snapshot.clients.some((client) => !isPrivateIpv4(client.ip))) {
      return NextResponse.json({ success: false, error: 'Client records must use private IPv4 addresses' }, { status: 400 });
    }

    const router = await prisma.router.upsert({
      where: { name: snapshot.router.name },
      create: {
        name: snapshot.router.name,
        address: snapshot.router.address,
        protocol: 'http',
        apiEndpoint: '/goform/getStatus,/goform/getQos',
        pollingInterval: 60,
        enabled: true,
        lastCheck: checkedAt,
        status: 'CONNECTED',
      },
      update: {
        address: snapshot.router.address,
        apiEndpoint: '/goform/getStatus,/goform/getQos',
        enabled: true,
        lastCheck: checkedAt,
        status: 'CONNECTED',
      },
      select: { id: true, name: true, status: true },
    });

    const observations = [
      ['CONNECTED_DEVICES', String(snapshot.summary.observedClientCount), 'SUCCESS', null],
      ['REPORTED_ONLINE_COUNT', snapshot.summary.reportedOnlineCount === null ? null : String(snapshot.summary.reportedOnlineCount), snapshot.summary.reportedOnlineCount === null ? 'UNAVAILABLE' : 'SUCCESS', null],
      ['BLACKLIST_COUNT', String(snapshot.summary.blacklistCount), 'SUCCESS', null],
      ['WIFI_SIGNAL_DBM', snapshot.summary.wifiSignalDbm === null ? null : String(snapshot.summary.wifiSignalDbm), snapshot.summary.wifiSignalDbm === null ? 'UNAVAILABLE' : 'SUCCESS', null],
      ['WAN_TYPE', snapshot.router.wanType, snapshot.router.wanType ? 'SUCCESS' : 'UNAVAILABLE', null],
      ['FIRMWARE', snapshot.router.firmware, snapshot.router.firmware ? 'SUCCESS' : 'UNAVAILABLE', null],
      ['WAN_STATUS_CODE', snapshot.router.wanStatusCode, snapshot.router.wanStatusCode ? 'SUCCESS' : 'UNAVAILABLE', null],
      ['WAN_GATEWAY', snapshot.router.wanGateway, snapshot.router.wanGateway ? 'SUCCESS' : 'UNAVAILABLE', null],
      ['DNS_SERVERS', JSON.stringify(snapshot.router.dnsServers), 'SUCCESS', null],
      ['CLIENTS_JSON', JSON.stringify(snapshot.clients), 'SUCCESS', null],
      ['PROVENANCE_JSON', JSON.stringify(snapshot.provenance), 'SUCCESS', null],
      ['WAN_ADDRESS_CLASS', snapshot.router.wanAddressClass, 'SUCCESS', null],
    ] as const;

    await prisma.routerObservation.createMany({
      data: observations.map(([metric, value, status, error]) => ({
        routerId: router.id, metric, value, status, error, timestamp: checkedAt,
      })),
    });
    if (!previousRouter || previousRouter.status !== 'CONNECTED') {
      await prisma.routerEvent.create({
        data: {
          routerId: router.id,
          eventType: 'CONNECTED',
          timestamp: checkedAt,
          details: {
            source: snapshot.source,
            observedClientCount: snapshot.summary.observedClientCount,
            reportedOnlineCount: snapshot.summary.reportedOnlineCount,
            provenance: snapshot.provenance,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { routerId: router.id, routerName: router.name, status: router.status, observationsStored: observations.length, observedAt: checkedAt.toISOString() },
    }, { status: 202, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to persist network snapshot' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!process.env.NETWORK_AGENT_TOKEN) {
    return NextResponse.json({ success: false, error: 'NETWORK_AGENT_TOKEN is not configured' }, { status: 503 });
  }
  if (!authorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized agent' }, { status: 401 });
  }
  try {
    const routers = await prisma.router.findMany({
      where: { enabled: true },
      select: {
        id: true, name: true, address: true, status: true, lastCheck: true,
        observations: { orderBy: { timestamp: 'desc' }, take: 24, select: { metric: true, value: true, status: true, timestamp: true } },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, data: routers }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to read network observations' }, { status: 500 });
  }
}
