export function ensureAllowedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const blockedProtocols = ['javascript:', 'file:', 'data:'];
    if (blockedProtocols.includes(parsed.protocol.toLowerCase())) {
      throw new Error('Blocked protocol');
    }
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname.endsWith('.local')) {
      throw new Error('Local/private access not allowed');
    }
    return parsed.toString();
  } catch {
    throw new Error('Invalid or blocked URL');
  }
}

export function redactSensitive(value?: string | null) {
  if (!value) return 'N/A';
  return value.length <= 6 ? '***' : `${value.slice(0, 2)}${'*'.repeat(value.length - 4)}${value.slice(-2)}`;
}
