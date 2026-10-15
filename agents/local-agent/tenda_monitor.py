#!/usr/bin/env python3
"""Read-only Tenda V12 router collector for MY_ADMIN's local agent.

Only GET requests are issued to the router. Router MAC addresses, credentials,
and raw router payloads are deliberately excluded from emitted snapshots.
"""
from __future__ import annotations
import argparse, ipaddress, json, os, sys, time, urllib.error, urllib.parse, urllib.request
from datetime import datetime, timezone
from typing import Any

def validate_router_url(value: str) -> str:
    parsed = urllib.parse.urlsplit(value)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise ValueError("ROUTER_URL must be an http(s) URL with an IP address")
    if parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise ValueError("ROUTER_URL must not contain credentials, query, or fragment")
    try:
        address = ipaddress.ip_address(parsed.hostname)
    except ValueError as exc:
        raise ValueError("ROUTER_URL must use a literal IP address") from exc
    if address.version != 4 or not address.is_private or address.is_loopback or address.is_link_local:
        raise ValueError("Router address must be a private IPv4 LAN address")
    if parsed.path not in ("", "/"):
        raise ValueError("ROUTER_URL must be the router origin only")
    return f"{parsed.scheme}://{address}"

def _request_json(url: str, timeout: float) -> dict[str, Any]:
    request = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "MY_ADMIN-LocalAgent/1.0"}, method="GET")
    with urllib.request.urlopen(request, timeout=timeout) as response:
        if response.status != 200:
            raise RuntimeError(f"Router returned HTTP {response.status}")
        payload = response.read(1_000_001)
    if len(payload) > 1_000_000:
        raise RuntimeError("Router response exceeded 1 MB limit")
    data = json.loads(payload.decode("utf-8"))
    if not isinstance(data, dict):
        raise ValueError("Router response is not a JSON object")
    return data

def _as_dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}

def _as_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []

def _text(value: Any, limit: int = 100) -> str | None:
    if value is None:
        return None
    result = str(value).strip()
    return result[:limit] if result else None

def _number(value: Any) -> float | None:
    try:
        result = float(value)
        return result if result == result and abs(result) != float("inf") else None
    except (TypeError, ValueError):
        return None

def parse_snapshot(status: dict[str, Any], qos: dict[str, Any], router_url: str) -> dict[str, Any]:
    status_data = _as_dict(status.get("data")) or status
    system = _as_dict(status_data.get("systemInfo"))
    statistics = _as_dict(status_data.get("deviceStastics"))
    internet = _as_dict(status_data.get("internetStatus"))
    qos_data = _as_dict(qos.get("data")) or qos
    raw_clients = _as_list(qos_data.get("onlineList"))
    clients = []
    for index, item in enumerate(raw_clients, start=1):
        item = _as_dict(item)
        address = _text(item.get("qosListIP"), 45)
        try:
            parsed_ip = ipaddress.ip_address(address or "")
            if parsed_ip.version != 4 or not parsed_ip.is_private:
                continue
        except ValueError:
            continue
        clients.append({
            "index": index,
            "name": _text(item.get("qosListHostname") or item.get("qosListRemark"), 80) or "Unknown",
            "ip": str(parsed_ip),
            "connectionType": _text(item.get("qosListConnectType"), 20) or "unknown",
            "downloadMbps": _number(item.get("qosListDownSpeed")),
            "uploadMbps": _number(item.get("qosListUpSpeed")),
            "accessAllowed": str(item.get("qosListAccess", "")).lower() == "true",
        })
    black_list = _as_list(qos_data.get("blackList"))
    wan_ip = _text(system.get("statusWanIP"), 45)
    return {
        "schemaVersion": 1,
        "source": "tenda-v12-readonly",
        "router": {
            "name": _text(statistics.get("routerName"), 80) or "Tenda Router",
            "address": urllib.parse.urlsplit(router_url).hostname,
            "firmware": _text(system.get("softVersion"), 80),
            "lanIp": _text(system.get("lanIP"), 45),
            "wanType": _text(system.get("wanType"), 30),
            "wanStatusCode": _text(internet.get("wanConnectStatus"), 40),
            "wanAddressClass": _classify_wan_ip(wan_ip),
            "wanGateway": _text(system.get("statusWanGaterway"), 45),
            "dnsServers": [v for v in [_text(system.get("statusWanDns1"), 45), _text(system.get("statusWanDns2"), 45)] if v],
        },
        "summary": {
            "reportedOnlineCount": _number(statistics.get("statusOnlineNumber")),
            "observedClientCount": len(clients),
            "blacklistCount": len(black_list),
            "wifiSignalDbm": _number(statistics.get("wifiRate")),
        },
        "clients": clients,
        "provenance": {
            "status": "OBSERVED", "clients": "OBSERVED", "speedSample": "INSTANTANEOUS_SAMPLE",
            "macAddresses": "OMITTED_FOR_PRIVACY", "wanAddress": "OMITTED_FOR_PRIVACY",
        },
        "observedAt": datetime.now(timezone.utc).isoformat(),
    }

def _classify_wan_ip(value: str | None) -> str:
    if not value:
        return "UNAVAILABLE"
    try:
        address = ipaddress.ip_address(value)
    except ValueError:
        return "INVALID_SOURCE_VALUE"
    if address.is_private:
        return "PRIVATE_OR_UPSTREAM_NAT_POSSIBLE"
    if address.is_global:
        return "GLOBAL"
    return "SPECIAL_USE"

def collect(router_url: str, timeout: float = 4.0) -> dict[str, Any]:
    origin = validate_router_url(router_url)
    nonce = str(int(time.time() * 1000))
    status_url = f"{origin}/goform/getStatus?{urllib.parse.urlencode({'random': nonce})}"
    qos_query = urllib.parse.urlencode({"random": nonce, "modules": "localhost,onlineList,blackList"})
    qos_url = f"{origin}/goform/getQos?{qos_query}"
    return parse_snapshot(_request_json(status_url, timeout), _request_json(qos_url, timeout), origin)

def send_snapshot(snapshot: dict[str, Any], api_url: str, token: str, timeout: float = 8.0) -> None:
    parsed = urllib.parse.urlsplit(api_url)
    if parsed.scheme != "https" and parsed.hostname not in ("localhost", "127.0.0.1"):
        raise ValueError("NETWORK_AGENT_API_URL must use HTTPS except on localhost")
    request = urllib.request.Request(api_url, data=json.dumps(snapshot, separators=(",", ":")).encode("utf-8"),
        headers={"Content-Type": "application/json", "X-Network-Agent-Token": token}, method="POST")
    with urllib.request.urlopen(request, timeout=timeout) as response:
        if response.status < 200 or response.status >= 300:
            raise RuntimeError(f"MY_ADMIN API returned HTTP {response.status}")
        response.read(4096)

def main() -> int:
    parser = argparse.ArgumentParser(description="Read-only Tenda router monitor for MY_ADMIN")
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--interval", type=int, default=int(os.getenv("POLL_INTERVAL", "60")))
    parser.add_argument("--timeout", type=float, default=float(os.getenv("ROUTER_TIMEOUT", "4")))
    args = parser.parse_args()
    try:
        router_url = validate_router_url(os.getenv("ROUTER_URL", "http://192.168.0.1"))
    except ValueError as exc:
        print(json.dumps({"status": "CONFIG_ERROR", "error": str(exc)}), file=sys.stderr)
        return 2
    api_url, token = os.getenv("NETWORK_AGENT_API_URL", "").strip(), os.getenv("NETWORK_AGENT_TOKEN", "").strip()
    if bool(api_url) != bool(token):
        print("Set both NETWORK_AGENT_API_URL and NETWORK_AGENT_TOKEN, or neither.", file=sys.stderr)
        return 2
    if args.interval < 10 and not args.once:
        print("--interval must be at least 10 seconds", file=sys.stderr)
        return 2
    while True:
        try:
            snapshot = collect(router_url, max(1.0, min(args.timeout, 15.0)))
            if api_url and token:
                send_snapshot(snapshot, api_url, token)
                print(json.dumps({"status": "UPLOADED", "observedAt": snapshot["observedAt"], "clientCount": snapshot["summary"]["observedClientCount"]}))
            else:
                print(json.dumps(snapshot, ensure_ascii=False))
        except (OSError, ValueError, RuntimeError, urllib.error.URLError, json.JSONDecodeError) as exc:
            print(json.dumps({"status": "COLLECTION_ERROR", "source": "tenda-v12-readonly", "error": str(exc)[:240], "observedAt": datetime.now(timezone.utc).isoformat()}), file=sys.stderr)
        if args.once:
            return 0
        time.sleep(max(10, args.interval))

if __name__ == "__main__":
    raise SystemExit(main())
