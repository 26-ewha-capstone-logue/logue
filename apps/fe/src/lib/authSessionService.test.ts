import { describe, expect, it } from 'vitest';
import {
  getAuthRouteBypassRequirements,
  getAuthRouteDecision,
} from './authSessionService';

const CURRENT_URL = new URL('https://www.asklogue.co/data/12?q=csv#preview');

describe('auth session route decision service', () => {
  it('redirects anonymous private route visits to login with the current path', () => {
    expect(
      getAuthRouteDecision({
        currentUrl: CURRENT_URL,
        pathname: '/data/12',
        shouldBypassAuthEntryRedirect: false,
        shouldBypassPrivatePathRedirect: false,
        shouldCheckAuthEntryRedirect: true,
        status: 'anonymous',
      }),
    ).toEqual({
      type: 'replace',
      path: '/login?next=%2Fdata%2F12%3Fq%3Dcsv%23preview',
    });
  });

  it('allows anonymous private route visits when the private redirect is bypassed', () => {
    expect(
      getAuthRouteDecision({
        currentUrl: CURRENT_URL,
        pathname: '/data/12',
        shouldBypassAuthEntryRedirect: false,
        shouldBypassPrivatePathRedirect: true,
        shouldCheckAuthEntryRedirect: true,
        status: 'anonymous',
      }),
    ).toEqual({ type: 'none' });
  });

  it('redirects authenticated auth entry visits unless the auth entry redirect is bypassed', () => {
    expect(
      getAuthRouteDecision({
        currentUrl: new URL('https://www.asklogue.co/'),
        pathname: '/',
        shouldBypassAuthEntryRedirect: false,
        shouldBypassPrivatePathRedirect: false,
        shouldCheckAuthEntryRedirect: true,
        status: 'authenticated',
      }),
    ).toEqual({ type: 'replace', path: '/analysis' });

    expect(
      getAuthRouteDecision({
        currentUrl: new URL('https://www.asklogue.co/'),
        pathname: '/',
        shouldBypassAuthEntryRedirect: true,
        shouldBypassPrivatePathRedirect: false,
        shouldCheckAuthEntryRedirect: true,
        status: 'authenticated',
      }),
    ).toEqual({ type: 'none' });
  });

  it('reports only the bypasses that can affect the current decision', () => {
    expect(
      getAuthRouteBypassRequirements({
        pathname: '/data',
        shouldCheckAuthEntryRedirect: true,
        status: 'anonymous',
      }),
    ).toEqual({ authEntry: false, privatePath: true });

    expect(
      getAuthRouteBypassRequirements({
        pathname: '/',
        shouldCheckAuthEntryRedirect: true,
        status: 'authenticated',
      }),
    ).toEqual({ authEntry: true, privatePath: false });
  });
});
