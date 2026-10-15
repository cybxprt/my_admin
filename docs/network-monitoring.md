# MY_ADMIN Network Monitoring — Tenda V12 Local Agent

## Purpose

The Tenda V12 collector is a local-network agent for the MY_ADMIN operations platform. It gathers router status and connected-client inventory using read-only HTTP GET requests, normalizes the observations, and can submit snapshots to the protected MY_ADMIN API. The cloud deployment cannot reach a private LAN router directly; the collector must run on a device connected to that LAN (Termux is supported).

## Observed environment baseline

These values were observed from the owner's router at the time this integration was designed. They are a baseline, not hard-coded live telemetry.

| Field | Observed value |
|---|---|
| Router label | `SUNNAH` |
| Router LAN address | `192.168.0.1` |
| LAN subnet | `192.168.0.0/24` |
| Firmware | `V12.01.01.42_multi` |
| Router API | `/goform/getStatus`, `/goform/getQos` |
| WAN mode | `pppoe` |
| Reported online clients in last capture | 6 |
| QoS client-list entries in last capture | 6 |
| Blacklist entries in last capture | 0 |

Client names and IP addresses can change. The earlier capture showed two similar Infinix/NOTE-50-PRO labels on different IPs; that alone does not prove duplicate hardware or an intrusion. Private/randomized Wi-Fi MACs, stale router labels, or two devices with similar names are possible explanations. The collector intentionally never exports MAC addresses and does not label an unknown client as malicious.

## Install and run on Termux

Python 3 is sufficient; no third-party packages are required.

```sh
mkdir -p ~/my_admin-agent
# Copy agents/local-agent/tenda_monitor.py from this repository into that directory.
cd ~/my_admin-agent
chmod +x tenda_monitor.py
ROUTER_URL=http://192.168.0.1 python tenda_monitor.py --once
```

Continuous local sampling (minimum 10 seconds; recommended 30–60 seconds):

```sh
ROUTER_URL=http://192.168.0.1 POLL_INTERVAL=60 python tenda_monitor.py
```

Each successful local sample prints one JSON line. Errors are emitted to stderr and include provenance; missing source fields are not invented.

## Connect to a deployed MY_ADMIN instance

1. Configure `NETWORK_AGENT_TOKEN` as a high-entropy secret in the server's deployment environment. Do not commit it.
2. Configure the matching token on the trusted local collector only.
3. Set `NETWORK_AGENT_API_URL` to `https://YOUR-MY-ADMIN-HOST/api/network/agent`.
4. Set `NETWORK_AGENT_TOKEN` and `ROUTER_URL` in the collector environment, then run the collector.
5. Use HTTPS for all non-local API traffic. The server rejects unauthenticated submissions.

Do not expose the router's admin interface to the public internet. The cloud service receives normalized metadata only; router passwords, MAC addresses, and WAN IP addresses are not included in snapshots.

## Current telemetry and interpretation

- `reportedOnlineCount` is the router's status-page count.
- `observedClientCount` is the number of valid private IPv4 entries in `onlineList`.
- A mismatch between those counts is a reconciliation signal, not proof of an attack.
- A `0.00` speed value is an instantaneous sample, not proof that a client is inactive.
- A private WAN address means upstream NAT is possible; it does not by itself prove CGNAT.
- `wanStatusCode` is retained as an observed opaque value. No undocumented meaning is assigned to it.
- Router field `newLanIP` is not treated as the actual LAN address.
- Provenance is recorded as observed, instantaneous, omitted, or unavailable where applicable.

## Safety boundaries

The adapter only uses `GET /goform/getStatus` and `GET /goform/getQos`. It never invokes QoS setters, Wi-Fi configuration, blacklist mutations, reboot, reset, or firmware endpoints. It requires a private IPv4 router target and limits request timeouts and response size.

## Tests

Run the Python unit tests from the repository root:

```sh
python -m unittest tests/test_tenda_monitor.py -v
```

The tests cover private-target validation, field normalization, missing source values, and omission of MAC addresses.
