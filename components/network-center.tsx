"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownUp, BadgeCheck, Cable, CheckCircle2, ChevronRight,
  HelpCircle, Cloud, Copy, Cpu, Database, Globe2, LockKeyhole, Radar,
  RefreshCw, Router, Search, Server, Shield, Signal, Terminal, Wifi,
  XCircle, Zap,
} from "lucide-react";

type Tool = { name: string; category: string; description: string; mode: "hosted" | "agent" | "reference"; command?: string };
const tools: Tool[] = [
  { name: "DNS Lookup", category: "DNS & Internet", description: "Resolve a public domain to IPv4 and IPv6 addresses using the hosted DNS service.", mode: "hosted" },
  { name: "IP & CIDR Calculator", category: "Addressing", description: "Calculate network address, broadcast address, usable range and address count locally in your browser.", mode: "hosted" },
  { name: "Port & Protocol Registry", category: "Ports & Sockets", description: "Search common TCP/UDP ports and their standard service assignments.", mode: "reference" },
  { name: "HTTP / TLS Inspector", category: "Web & API", description: "Review safe inspection steps for a site you own; active checks require an authorized local agent.", mode: "agent" },
  { name: "LAN Device Discovery", category: "LAN & Routing", description: "Discover devices on a network you administer. Requires the local Termux/Linux agent.", mode: "agent" },
  { name: "Ping & Traceroute", category: "LAN & Routing", description: "Measure reachability and route hops from your own device using the local agent.", mode: "agent" },
  { name: "Traffic Capture & Analysis", category: "Traffic & Monitoring", description: "Capture and inspect packets on interfaces where you have permission; local agent required.", mode: "agent" },
  { name: "Wi-Fi Signal & Channel", category: "Wireless & RF", description: "Read signal strength, frequency band and channel from supported device APIs.", mode: "agent" },
  { name: "Public ASN / WHOIS", category: "DNS & Internet", description: "Registry and ownership research for public IPs and domains; source availability varies.", mode: "reference" },
  { name: "Server & Cloud Inventory", category: "Servers & Cloud", description: "Track configured hosts, health endpoints and deployment metadata without fabricated telemetry.", mode: "hosted" },
  { name: "Security Posture Checks", category: "Security", description: "Organize authorized configuration reviews, dependency checks and defensive findings.", mode: "hosted" },
  { name: "Remote Session Manager", category: "Remote Access", description: "Document approved SSH/RDP endpoints. Credentials belong in a secret manager, never in source code.", mode: "hosted" },
  { name: "Maritime & Aviation Reference", category: "Specialized Networks", description: "Reference navigation, radio and satellite communication standards; no live receiver is implied.", mode: "reference" },
  { name: "Satellite & Space Links", category: "Specialized Networks", description: "Catalog public satellite, GNSS and ground-station concepts and data sources.", mode: "reference" },
  { name: "Offline Queue & Sync", category: "Automation", description: "Queue local-agent jobs for later sync when an authenticated backend is configured.", mode: "agent" },
  { name: "Audit & Export", category: "Automation", description: "Prepare timestamped inventory and findings exports from collected, source-backed data.", mode: "hosted" },
];
const categories = ["All tools", ...Array.from(new Set(tools.map((t) => t.category)))];
const ports = [
  [20, "FTP data", "TCP"], [21, "FTP control", "TCP"], [22, "SSH", "TCP"], [25, "SMTP", "TCP"],
  [53, "DNS", "TCP/UDP"], [67, "DHCP server", "UDP"], [68, "DHCP client", "UDP"], [80, "HTTP", "TCP"],
  [123, "NTP", "UDP"], [143, "IMAP", "TCP"], [161, "SNMP", "UDP"], [443, "HTTPS", "TCP"],
  [445, "SMB", "TCP"], [465, "SMTPS", "TCP"], [587, "SMTP submission", "TCP"], [853, "DNS over TLS", "TCP"],
  [993, "IMAPS", "TCP"], [1194, "OpenVPN default", "UDP"], [1433, "MS SQL Server", "TCP"],
  [3000, "Development server (common)", "TCP"], [3306, "MySQL", "TCP"], [3389, "RDP", "TCP"],
  [5432, "PostgreSQL", "TCP"], [5900, "VNC (common)", "TCP"], [6379, "Redis", "TCP"], [8080, "HTTP alternate", "TCP"],
  [8443, "HTTPS alternate", "TCP"], [27017, "MongoDB", "TCP"],
] as const;

function ipv4Number(value: string): bigint | null {
  const parts = value.trim().split(".");
  if (parts.length !== 4 || parts.some((p) => !/^\d{1,3}$/.test(p) || Number(p) > 255)) return null;
  return parts.reduce((n, part) => (n << 8n) + BigInt(Number(part)), 0n);
}
function ipv4Text(value: bigint): string {
  return [24n, 16n, 8n, 0n].map((shift) => Number((value >> shift) & 255n)).join(".");
}
function cidrResult(input: string): string[] | null {
  const match = input.trim().match(/^([^/]+)\/(\d{1,2})$/);
  if (!match) return null;
  const ip = ipv4Number(match[1]);
  const prefix = Number(match[2]);
  if (ip === null || prefix < 0 || prefix > 32) return null;
  const all = (1n << 32n) - 1n;
  const mask = prefix === 0 ? 0n : (all << BigInt(32 - prefix)) & all;
  const network = ip & mask;
  const broadcast = network | (all ^ mask);
  const count = 1n << BigInt(32 - prefix);
  const usable = prefix >= 31 ? count.toString() : (count - 2n).toString();
  return [
    "Network: " + ipv4Text(network) + "/" + prefix,
    "Subnet mask: " + ipv4Text(mask),
    "Broadcast: " + ipv4Text(broadcast),
    "Address count: " + count.toString(),
    "Usable hosts (traditional IPv4): " + usable,
    "Usable range: " + (prefix >= 31 ? "point-to-point / special case" : ipv4Text(network + 1n) + " – " + ipv4Text(broadcast - 1n)),
  ];
}

export function NetworkCenter() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All tools");
  const [dnsName, setDnsName] = useState("");
  const [dnsResult, setDnsResult] = useState<{ ipv4: string[]; ipv6: string[]; error?: string } | null>(null);
  const [dnsBusy, setDnsBusy] = useState(false);
  const [cidr, setCidr] = useState("192.168.1.10/24");
  const [portQuery, setPortQuery] = useState("");
  const [serviceStatus, setServiceStatus] = useState<"checking" | "online" | "offline">("checking");
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    let live = true;
    fetch("/api/network/health", { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error("unavailable"); return r.json(); })
      .then((data) => { if (live) setServiceStatus(data.status === "ok" ? "online" : "offline"); })
      .catch(() => { if (live) setServiceStatus("offline"); });
    return () => { live = false; };
  }, []);

  const visibleTools = useMemo(() => tools.filter((tool) =>
    (category === "All tools" || tool.category === category) &&
    (tool.name + " " + tool.category + " " + tool.description).toLowerCase().includes(query.toLowerCase())
  ), [category, query]);
  const cidrLines = useMemo(() => cidrResult(cidr), [cidr]);
  const visiblePorts = useMemo(() => ports.filter((p) =>
    (String(p[0]) + " " + p[1] + " " + p[2]).toLowerCase().includes(portQuery.toLowerCase())
  ), [portQuery]);

  async function lookupDns(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDnsBusy(true); setDnsResult(null);
    try {
      const response = await fetch("/api/network/dns?domain=" + encodeURIComponent(dnsName.trim()), { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Lookup failed");
      setDnsResult(data);
    } catch (error) {
      setDnsResult({ ipv4: [], ipv6: [], error: error instanceof Error ? error.message : "Lookup failed" });
    } finally { setDnsBusy(false); }
  }
  async function copyText(value: string) {
    try { await navigator.clipboard.writeText(value); setCopyMessage("Copied to clipboard"); }
    catch { setCopyMessage("Clipboard permission unavailable"); }
    window.setTimeout(() => setCopyMessage(""), 2200);
  }

  return (
    <main className="nc-shell">
      <aside className="nc-sidebar">
        <a className="nc-brand" href="/" aria-label="SunnahOS home"><span className="nc-brand-mark"><Radar size={22} /></span><span><b>SunnahOS</b><small>UNIVERSAL NETWORK CENTER</small></span></a>
        <div className="nc-side-label">WORKSPACE</div>
        <a className="nc-nav active" href="#overview"><Activity size={17} /> Overview</a>
        <a className="nc-nav" href="#tools"><Cable size={17} /> Tool directory</a>
        <a className="nc-nav" href="#dns"><Globe2 size={17} /> DNS lookup</a>
        <a className="nc-nav" href="#addressing"><Router size={17} /> IP & addressing</a>
        <a className="nc-nav" href="#ports"><ArrowDownUp size={17} /> Ports & protocols</a>
        <a className="nc-nav" href="#security"><Shield size={17} /> Security posture</a>
        <div className="nc-sidebar-bottom"><div className="nc-agent-icon"><Terminal size={18} /></div><b>Local agent</b><span>Not connected</span><p>Install the authorized Termux/Linux agent to access device-only diagnostics.</p><a href="https://github.com/cybxprt/my_admin#local-agent" target="_blank" rel="noreferrer">Agent setup <ChevronRight size={14} /></a></div>
      </aside>

      <section className="nc-main">
        <header className="nc-topbar"><div><span className="nc-eyebrow">NETWORK OPERATIONS / OVERVIEW</span><h1>Universal Network Center</h1><p>One workspace for network intelligence, diagnostics and defensive operations.</p></div><div className="nc-top-actions"><span className={"nc-status " + serviceStatus}><i />{serviceStatus === "checking" ? "Checking service" : serviceStatus === "online" ? "API online" : "API unavailable"}</span><button className="nc-icon-button" title="Refresh service status" onClick={() => { setServiceStatus("checking"); fetch("/api/network/health", { cache: "no-store" }).then(r=>r.json()).then(d=>setServiceStatus(d.status === "ok" ? "online" : "offline")).catch(()=>setServiceStatus("offline")); }}><RefreshCw size={17} /></button></div></header>

        <div id="overview" className="nc-hero"><div><div className="nc-hero-tag"><Zap size={14} /> NETWORK INTELLIGENCE PLATFORM</div><h2>See your network.<br /><span>Understand every layer.</span></h2><p>Explore addressing, DNS, ports, infrastructure, traffic, wireless and specialized communication systems from a single control surface.</p><a href="#tools" className="nc-primary-link">Explore tool directory <ChevronRight size={16} /></a></div><div className="nc-hero-art" aria-hidden="true"><div className="nc-orbit orbit-one" /><div className="nc-orbit orbit-two" /><div className="nc-orbit orbit-three" /><div className="nc-orbit-core"><Radar size={48} /></div><span className="nc-node node-a" /><span className="nc-node node-b" /><span className="nc-node node-c" /><span className="nc-node node-d" /></div></div>

        <div className="nc-metrics">
          <article className="nc-metric"><span className="nc-metric-icon blue"><Cable size={19} /></span><span className="nc-metric-label">Catalogued modules</span><strong>{tools.length}</strong><small>Hosted, agent & reference</small></article>
          <article className="nc-metric"><span className="nc-metric-icon green"><CheckCircle2 size={19} /></span><span className="nc-metric-label">Hosted API</span><strong>{serviceStatus === "online" ? "Healthy" : serviceStatus === "checking" ? "Checking" : "Offline"}</strong><small>Verified by health endpoint</small></article>
          <article className="nc-metric"><span className="nc-metric-icon purple"><Wifi size={19} /></span><span className="nc-metric-label">Local agent</span><strong>Disconnected</strong><small>No device telemetry received</small></article>
          <article className="nc-metric"><span className="nc-metric-icon orange"><Shield size={19} /></span><span className="nc-metric-label">Operating mode</span><strong>Authorized</strong><small>Defensive / owner-approved scope</small></article>
        </div>

        <section id="tools" className="nc-section"><div className="nc-section-head"><div><span className="nc-eyebrow">DISCOVER & OPERATE</span><h2>Network tool directory</h2><p>Choose a module by task. Agent-required tools are clearly marked.</p></div><div className="nc-search"><Search size={17} /><input aria-label="Search tools" placeholder="Search tools, protocols, tasks…" value={query} onChange={e=>setQuery(e.target.value)} /></div></div>
          <div className="nc-category-list">{categories.map((item)=><button key={item} className={category===item?"selected":""} onClick={()=>setCategory(item)}>{item}</button>)}</div>
          <div className="nc-tool-grid">{visibleTools.map((tool, index)=><article className="nc-tool-card" key={tool.name}><div className="nc-tool-card-top"><span className="nc-tool-icon">{iconFor(tool.category)}</span><span className={"nc-mode " + tool.mode}>{tool.mode === "hosted" ? "HOSTED" : tool.mode === "agent" ? "LOCAL AGENT" : "REFERENCE"}</span></div><h3>{tool.name}</h3><p>{tool.description}</p><a href={tool.name === "DNS Lookup" ? "#dns" : tool.name === "IP & CIDR Calculator" ? "#addressing" : tool.name === "Port & Protocol Registry" ? "#ports" : "#security"}>Open module <ChevronRight size={14} /></a></article>)}</div>
          {visibleTools.length===0 && <div className="nc-empty">No modules match that search. Try another term or category.</div>}
        </section>

        <div className="nc-two-col">
          <section id="dns" className="nc-panel"><div className="nc-panel-title"><span className="nc-panel-icon"><Globe2 size={18} /></span><div><h2>DNS lookup</h2><p>Public domain A / AAAA resolution</p></div></div><form className="nc-form" onSubmit={lookupDns}><label htmlFor="dns-domain">Domain name</label><div className="nc-input-row"><input id="dns-domain" value={dnsName} onChange={e=>setDnsName(e.target.value)} placeholder="example.com" autoComplete="url" required /><button disabled={dnsBusy} type="submit">{dnsBusy ? "Resolving…" : "Resolve"}</button></div></form>
            {dnsResult && <div className={"nc-result " + (dnsResult.error?"error":"")} role="status">{dnsResult.error ? <p><XCircle size={16} /> {dnsResult.error}</p> : <><b>DNS response</b><div className="nc-dns-list"><span>IPv4 (A)</span><div>{dnsResult.ipv4.length ? dnsResult.ipv4.map(ip=><code key={ip}>{ip}</code>) : <small>No A records returned</small>}</div><span>IPv6 (AAAA)</span><div>{dnsResult.ipv6.length ? dnsResult.ipv6.map(ip=><code key={ip}>{ip}</code>) : <small>No AAAA records returned</small>}</div></div><button className="nc-copy" onClick={()=>copyText(JSON.stringify(dnsResult,null,2))}><Copy size={14} /> Copy result</button></>}</div>}
            <p className="nc-disclaimer">Lookup runs on the hosted service. Results are DNS data, not proof that a host or service is reachable.</p>
          </section>
          <section id="addressing" className="nc-panel"><div className="nc-panel-title"><span className="nc-panel-icon"><Router size={18} /></span><div><h2>IPv4 / CIDR calculator</h2><p>Calculated locally in your browser</p></div></div><label className="nc-label" htmlFor="cidr-input">IPv4 address / prefix</label><input className="nc-full-input" id="cidr-input" value={cidr} onChange={e=>setCidr(e.target.value)} placeholder="192.168.1.10/24" />{cidrLines ? <div className="nc-cidr-result">{cidrLines.map(line=><div key={line}><span>{line.split(":")[0]}</span><code>{line.substring(line.indexOf(":")+1).trim()}</code></div>)}</div> : <p className="nc-validation">Enter a valid IPv4 CIDR, for example 10.0.0.1/24.</p>}<p className="nc-disclaimer">IPv4 only. IPv6 subnet calculation is not included in this module yet.</p></section>
        </div>

        <section id="ports" className="nc-panel nc-port-panel"><div className="nc-section-head"><div className="nc-panel-title"><span className="nc-panel-icon"><ArrowDownUp size={18} /></span><div><h2>Port & protocol registry</h2><p>Common service assignments — not a scan of your network</p></div></div><div className="nc-search nc-port-search"><Search size={16} /><input aria-label="Search ports" value={portQuery} onChange={e=>setPortQuery(e.target.value)} placeholder="Search port / service" /></div></div><div className="nc-table-wrap"><table className="nc-table"><thead><tr><th>Port</th><th>Service</th><th>Transport</th></tr></thead><tbody>{visiblePorts.map(p=><tr key={p[0]}><td><code>{p[0]}</code></td><td>{p[1]}</td><td><span className="nc-protocol">{p[2]}</span></td></tr>)}</tbody></table></div></section>

        <section id="security" className="nc-security"><div className="nc-security-mark"><LockKeyhole size={22} /></div><div><h2>Security & authorization by design</h2><p>Active discovery, packet capture, vulnerability checks, remote sessions and device telemetry must run only against systems you own or are explicitly authorized to assess. These operations are not simulated by the hosted dashboard.</p><div className="nc-security-tags"><span><BadgeCheck size={14} /> Scope-first</span><span><Database size={14} /> Source-backed telemetry</span><span><HelpCircle size={14} /> Missing data marked unavailable</span></div></div></section>
        <footer className="nc-footer"><span>© {new Date().getFullYear()} SunnahOS Network Center</span><span><span className="nc-footer-dot" /> Hosted dashboard · Local agent optional</span><a href="https://github.com/cybxprt/my_admin" target="_blank" rel="noreferrer">Source repository <ChevronRight size={13} /></a></footer>
        {copyMessage && <div className="nc-toast" role="status">{copyMessage}</div>}
      </section>
    </main>
  );
}

function iconFor(category: string) {
  if (category.includes("DNS") || category.includes("Web")) return <Globe2 size={19} />;
  if (category.includes("Address")) return <Router size={19} />;
  if (category.includes("Ports")) return <Cable size={19} />;
  if (category.includes("LAN")) return <Activity size={19} />;
  if (category.includes("Traffic")) return <ArrowDownUp size={19} />;
  if (category.includes("Wireless")) return <Signal size={19} />;
  if (category.includes("Cloud") || category.includes("Servers")) return <Cloud size={19} />;
  if (category.includes("Security")) return <Shield size={19} />;
  if (category.includes("Access")) return <LockKeyhole size={19} />;
  if (category.includes("Automation")) return <Cpu size={19} />;
  return <Server size={19} />;
}
