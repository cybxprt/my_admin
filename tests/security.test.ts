import { ensureAllowedUrl, redactSensitive } from '../lib/security';

describe('ensureAllowedUrl', () => {
  it.each(['https://example.com/path', 'http://example.org'])('accepts public HTTP(S) URL: %s', (url) => {
    expect(ensureAllowedUrl(url)).toBe(new URL(url).toString());
  });

  it.each([
    'file:///etc/passwd',
    'javascript:alert(1)',
    'data:text/html,hello',
    'http://user:pass@example.com',
    'http://localhost',
    'http://printer.local',
    'http://10.0.0.1',
    'http://172.16.0.1',
    'http://192.168.1.1',
    'http://169.254.169.254/latest/meta-data/',
    'http://127.0.0.1',
    'http://224.0.0.1',
    'http://[::1]',
  ])('rejects unsafe URL: %s', (url) => {
    expect(() => ensureAllowedUrl(url)).toThrow();
  });

  it('rejects malformed input', () => {
    expect(() => ensureAllowedUrl('not a url')).toThrow('Invalid or blocked URL');
  });
});

describe('redactSensitive', () => {
  it('handles missing values', () => {
    expect(redactSensitive()).toBe('N/A');
    expect(redactSensitive(null)).toBe('N/A');
  });

  it('masks short and long secrets', () => {
    expect(redactSensitive('abc')).toBe('***');
    expect(redactSensitive('abcdefgh')).toBe('ab****gh');
  });
});
