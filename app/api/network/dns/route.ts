import { NextRequest, NextResponse } from "next/server";
import { resolve4, resolve6 } from "node:dns/promises";
import { isIP } from "node:net";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const forbiddenSuffixes = [".localhost", ".local", ".internal", ".test", ".invalid", ".example"];

function validDomain(value: string): boolean {
  if (!value || value.length > 253 || isIP(value)) return false;
  const domain = value.endsWith(".") ? value.slice(0, -1) : value;
  if (!domain || domain.includes("..") || domain.includes("/") || domain.includes(":")) return false;
  if (domain.toLowerCase() === "localhost" || forbiddenSuffixes.some((suffix) => domain.toLowerCase().endsWith(suffix))) return false;
  return domain.split(".").every((label) => label.length > 0 && label.length <= 63 && /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(label));
}

export async function GET(request: NextRequest) {
  const domain = (request.nextUrl.searchParams.get("domain") ?? "").trim();
  if (!validDomain(domain)) {
    return NextResponse.json({ error: "Enter a valid public domain name (not an IP address or local hostname)." }, { status: 400 });
  }

  const cleanDomain = domain.endsWith(".") ? domain.slice(0, -1) : domain;
  const [v4, v6] = await Promise.allSettled([
    resolve4(cleanDomain),
    resolve6(cleanDomain),
  ]);
  const ipv4 = v4.status === "fulfilled" ? v4.value : [];
  const ipv6 = v6.status === "fulfilled" ? v6.value : [];

  if (ipv4.length === 0 && ipv6.length === 0) {
    return NextResponse.json({ error: "No A or AAAA records were returned for this domain." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json(
    { domain: cleanDomain, ipv4, ipv6, resolvedAt: new Date().toISOString(), source: "host DNS resolver" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
