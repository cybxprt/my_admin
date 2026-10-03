export const appName = 'MY_ADMIN';

export function getStatusText(value: string | null | undefined, fallback = 'UNAVAILABLE FROM SOURCE') {
  return value && value.trim() ? value : fallback;
}

export function isSourceAvailable(value: string | null | undefined) {
  return Boolean(value && value.trim() && value.toUpperCase() !== 'UNAVAILABLE FROM SOURCE');
}

export function maskSecret(secret?: string | null) {
  if (!secret) return 'NOT_SET';
  if (secret.length <= 6) return '***';
  return `${secret.slice(0, 2)}${'*'.repeat(secret.length - 4)}${secret.slice(-2)}`;
}
