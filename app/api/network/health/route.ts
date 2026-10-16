import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "sunnahos-network-center",
      timestamp: new Date().toISOString(),
      capabilities: {
        hostedDashboard: true,
        dnsLookup: true,
        localAgent: false,
        packetCapture: false,
        lanDiscovery: false,
        radioDiagnostics: false,
      },
      note: "Device-level capabilities remain unavailable until an authorized local agent is connected.",
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
