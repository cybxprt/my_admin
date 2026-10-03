import React from 'react';
import { Activity, AlertTriangle, BellRing, ShieldCheck, Wifi, Cpu, Database, Smartphone, Router, Gauge, ChevronRight, Search, LayoutGrid, UserCog, Settings, Bell, FileText, Cloud } from 'lucide-react';

const systemCards = [
  { title: 'Security posture', value: 'UNAVAILABLE FROM SOURCE', meta: 'Threat intel status', icon: ShieldCheck, tone: 'emerald' },
  { title: 'Gateway', value: 'UNAVAILABLE FROM SOURCE', meta: 'Primary network route', icon: Wifi, tone: 'blue' },
  { title: 'ADB devices', value: 'ADB SOURCE UNAVAILABLE', meta: 'Authorized mobile inventory', icon: Smartphone, tone: 'violet' },
  { title: 'Agents', value: 'NO ACTIVE AGENTS', meta: 'Connected agents', icon: Cpu, tone: 'amber' },
];

const nav = [
  { label: 'Overview', icon: LayoutGrid },
  { label: 'Security', icon: ShieldCheck },
  { label: 'Network', icon: Wifi },
  { label: 'Devices', icon: Smartphone },
  { label: 'Alerts', icon: Bell },
  { label: 'Analytics', icon: Activity },
  { label: 'System', icon: Settings },
];

function StatusPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300">
      <span className="h-2 w-2 rounded-full bg-emerald-400" />
      {label}
    </span>
  );
}

export function DashboardShell() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 border-r border-slate-800 bg-slate-950/90 p-5 lg:flex lg:flex-col">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Operations</p>
              <h1 className="text-xl font-semibold">MY_ADMIN</h1>
            </div>
          </div>

          <nav className="space-y-2">
            {nav.map(({ label, icon: Icon }) => (
              <button
                key={label}
                className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-left text-sm text-slate-300 transition hover:border-sky-500/30 hover:bg-slate-800"
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-sky-300" />
                  {label}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </button>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="mb-3 flex items-center gap-2 text-slate-300">
              <Cloud className="h-4 w-4 text-sky-400" />
              <span className="text-sm font-medium">System posture</span>
            </div>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center justify-between"><span>Auth</span><span className="text-emerald-400">PROTECTED</span></div>
              <div className="flex items-center justify-between"><span>Data sources</span><span className="text-violet-400">SCANNING</span></div>
              <div className="flex items-center justify-between"><span>Collector health</span><span className="text-amber-400">PENDING</span></div>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-4 lg:p-6">
          <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Security Operations Center</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">MY_ADMIN Console</h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StatusPill label="System secure" />
              <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-300">
                <Search className="h-4 w-4 text-sky-300" />
                Search command / system
              </div>
              <button className="rounded-xl bg-sky-500 px-3 py-2 text-sm font-medium text-slate-950 shadow-lg shadow-sky-500/20 transition hover:bg-sky-400">
                New alert rule
              </button>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {systemCards.map(({ title, value, meta, icon: Icon, tone }) => (
              <article key={title} className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4 shadow-lg shadow-slate-950/20">
                <div className="mb-4 flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${tone}-500/10 text-${tone}-300 ring-1 ring-${tone}-500/20`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{meta}</span>
                </div>
                <p className="mb-2 text-sm text-slate-400">{title}</p>
                <p className="text-xl font-semibold text-white">{value}</p>
              </article>
            ))}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Operations heatmap</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">System activity</h3>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-400">
                  <Activity className="h-3.5 w-3.5 text-emerald-400" />
                  Live aggregation inactive
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
                {['Gateway', 'Router', 'ADB', 'Telegram', 'Agents', 'Security'].map((item, idx) => (
                  <div key={item} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
                    <div className={`mx-auto mb-2 h-2.5 w-2.5 rounded-full ${idx % 2 === 0 ? 'bg-amber-400' : 'bg-slate-500'}`} />
                    <div className="text-xs text-slate-300">{item}</div>
                    <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">{idx % 2 === 0 ? 'DEGRADED' : 'UNAVAILABLE'}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Notifications</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">Central alerts</h3>
                </div>
                <BellRing className="h-4 w-4 text-sky-300" />
              </div>

              <div className="mt-4 space-y-3">
                {[{ label: 'Gateway telemetry unavailable', tone: 'amber' }, { label: 'Router source not configured', tone: 'violet' }, { label: 'Telegram integration disabled', tone: 'slate' }].map((alert) => (
                  <div key={alert.label} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-300">
                    <AlertTriangle className={`h-4 w-4 ${alert.tone === 'amber' ? 'text-amber-400' : alert.tone === 'violet' ? 'text-violet-400' : 'text-slate-400'}`} />
                    {alert.label}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4 xl:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Telemetry</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">Recent observations</h3>
                </div>
                <button className="text-sm text-sky-300">View all</button>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-800">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-950/80 text-slate-400">
                    <tr>
                      <th className="px-3 py-3 font-medium">Source</th>
                      <th className="px-3 py-3 font-medium">Target</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['network', '10.156.49.49', 'UNAVAILABLE FROM SOURCE', '—'],
                      ['router', '192.168.0.1', 'DISABLED', '—'],
                      ['adb', 'Authorized inventory', 'ADB SOURCE UNAVAILABLE', '—'],
                      ['telegram', 'bot:status', 'UNAVAILABLE FROM SOURCE', '—'],
                    ].map(([source, target, status, ts]) => (
                      <tr key={`${source}-${target}`} className="border-t border-slate-800 bg-slate-900/60">
                        <td className="px-3 py-3 text-slate-200">{source}</td>
                        <td className="px-3 py-3 text-slate-300">{target}</td>
                        <td className="px-3 py-3"><span className="rounded-full border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] uppercase text-slate-300">{status}</span></td>
                        <td className="px-3 py-3 text-slate-400">{ts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Status board</p>
              <div className="mt-4 space-y-4">
                {[
                  { label: 'Database', icon: Database, state: 'PENDING' },
                  { label: 'Gateway', icon: Wifi, state: 'UNAVAILABLE FROM SOURCE' },
                  { label: 'Router', icon: Router, state: 'DISABLED' },
                  { label: 'Latency', icon: Gauge, state: 'UNAVAILABLE FROM SOURCE' },
                ].map(({ label, icon: Icon, state }) => (
                  <div key={label} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2 text-slate-300"><Icon className="h-4 w-4 text-sky-300" />{label}</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{state}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
