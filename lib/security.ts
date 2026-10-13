const BLOCKED_HOST_SUFFIXES = ['.localhost', '.local', '.internal', '.lan', '.home', '.test', '.invalid'];

function isPrivateOrSpecialIpv4(host: string): boolean {
  const parts = host.split('.');
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) return false;
  const octets = parts.map(Number);
  if (octets.some((part) => part < 0 || part > 255)) return true;
  const [a, b, c] = octets;
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 192 && b === 88 && c === 99) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

/**
 * Syntax/hostname pre-validation only. A server-side fetcher must also resolve
 * DNS, reject every non-public resolved IP, pin the validated address, disable
 * automatic redirects, and revalidate each redirect to prevent SSRF/rebinding.
 */
export function ensureAllowedUrl(input: string): string {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new Error('Invalid or blocked URL');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS URLs are allowed');
  }
  if (parsed.username || parsed.password) {
    throw new Error('URLs containing credentials are not allowed');
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (
    !hostname ||
    hostname === 'localhost' ||
    hostname === 'metadata' ||
    BLOCKED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
  ) {
    throw new Error('Local or private destinations are not allowed');
  }
  if (hostname.includes(':')) {
    throw new Error('IPv6 literal destinations require explicit public-IP validation');
  }
  if (isPrivateOrSpecialIpv4(hostname)) {
    throw new Error('Private or special-use IP destinations are not allowed');
  }
  if (/^[0-9.]+$/.test(hostname) && !/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    throw new Error('Non-canonical IP destinations are not allowed');
  }

  return parsed.toString();
}

export function redactSensitive(value?: string | null): string {
  if (!value) return 'N/A';
  return value.length <= 6 ? '***' : `${value.slice(0, 2)}${'*'.repeat(value.length - 4)}${value.slice(-2)}`;
}
