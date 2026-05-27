import { describe, expect, it } from 'vitest';
import {
  getLoginRedirectPath,
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
});
