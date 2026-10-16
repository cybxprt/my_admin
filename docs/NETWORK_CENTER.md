# SunnahOS Universal Network Center

## Hosted features

- Responsive tool directory with searchable categories.
- Health endpoint at `/api/network/health`.
- Public-domain A/AAAA lookup at `/api/network/dns?domain=example.com`.
- Browser-local IPv4/CIDR calculator.
- Searchable common TCP/UDP service registry.
- Explicit distinction between hosted modules, reference modules, and local-agent modules.

## Production boundaries

The hosted dashboard does not claim to perform LAN scans, packet capture, ping, traceroute, Wi-Fi/RF measurements, remote desktop, or device monitoring. These require an authorized local Termux/Linux agent and explicit scope. Until that agent is implemented, those modules are marked LOCAL AGENT and telemetry is shown as disconnected/unavailable.

The DNS endpoint only resolves public domain names through the server's configured DNS resolver. It rejects IP literals and common local/test suffixes. It does not fetch arbitrary URLs or make HTTP requests to user-provided hosts.

## Deploy on Vercel

1. Import `cybxprt/my_admin` into Vercel and select the `main` branch.
2. Set the project root to the repository root.
3. Build command: `npm run build`; install command: `npm install`.
4. No environment variables are required for the hosted dashboard or DNS endpoint.
5. Check `/api/network/health` after deployment. A healthy response verifies the API route, not the local agent or physical network.
6. Enable preview deployments for pull requests and require build checks before production promotion.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Use `npm run build` and `npm run type-check` before release.

## Security

- Never commit access tokens, cookies, API keys, or device credentials.
- Do not add broad URL-fetching or arbitrary port-scan endpoints to public serverless functions.
- Active security tests must be restricted to assets you own or are authorized to assess.
- Keep real device telemetry source-backed and auditable.
