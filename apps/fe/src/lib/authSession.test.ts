import { describe, expect, it } from 'vitest';
import {
  getPostAuthRedirectPath,
  getLoginRedirectPath,
  normalizeAuthNextPath,
  shouldRedirectPrivatePath,
  type AuthStatus,
} from './authSession';

describe('auth session route guards', () => {
  it('redirects private routes only after auth is known to be anonymous', () => {
    const statuses = [
      'initializing',
      'authenticated',
      'anonymous',
    ] satisfies AuthStatus[];

    expect(
      statuses.map((status) => shouldRedirectPrivatePath(status, '/analysis')),
    ).toEqual([false, false, true]);
    expect(shouldRedirectPrivatePath('anonymous', '/')).toBe(false);
  });

  it('preserves the current private path in the login redirect', () => {
    expect(
      getLoginRedirectPath(
        new URL('https://www.asklogue.co/data/12?q=csv#preview'),
      ),
    ).toBe('/login?next=%2Fdata%2F12%3Fq%3Dcsv%23preview');
  });

  it('uses a safe next path after OAuth login', () => {
    expect(getPostAuthRedirectPath('/', '/data/12?q=csv#preview')).toBe(
      '/data/12?q=csv#preview',
    );
    expect(getPostAuthRedirectPath('/', 'https://evil.example.com')).toBe(
      '/analysis',
    );
    expect(getPostAuthRedirectPath('/', '//evil.example.com')).toBe(
      '/analysis',
    );
  });

  it('normalizes only app-owned post-auth next paths', () => {
    expect(normalizeAuthNextPath('/analysis/3?analysisFlowId=4')).toBe(
      '/analysis/3?analysisFlowId=4',
    );
    expect(normalizeAuthNextPath('/login')).toBeNull();
    expect(normalizeAuthNextPath('/public')).toBeNull();
  });
});
