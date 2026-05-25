export type AuthStatus = 'initializing' | 'authenticated' | 'anonymous';

const LOGIN_PATH = '/login';
const PRIVATE_PATH_PREFIXES = ['/analysis', '/data', '/history'];
export const AUTH_REDIRECT_PATH = '/analysis';
export const AUTH_NEXT_SEARCH_PARAM = 'next';
const ONBOARDING_PATH = '/onboarding';
const AUTH_ENTRY_PATHS = new Set(['/', '/login']);

function isPrivatePath(pathname: string) {
  return PRIVATE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function shouldRedirectAuthenticatedUser(pathname: string) {
  return AUTH_ENTRY_PATHS.has(pathname);
}

export function getLoginRedirectPath(currentUrl: URL) {
  const loginUrl = new URL(LOGIN_PATH, currentUrl.origin);
  const nextPath = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;

  if (nextPath && nextPath !== LOGIN_PATH) {
    loginUrl.searchParams.set(AUTH_NEXT_SEARCH_PARAM, nextPath);
  }

  return `${loginUrl.pathname}${loginUrl.search}${loginUrl.hash}`;
}

export function shouldRedirectPrivatePath(
  status: AuthStatus,
  pathname: string,
) {
  return status === 'anonymous' && isPrivatePath(pathname);
}

export function normalizeAuthNextPath(value: string | null | undefined) {
  const normalized = value?.trim();

  if (
    !normalized ||
    !normalized.startsWith('/') ||
    normalized.startsWith('//')
  ) {
    return null;
  }

  try {
    const url = new URL(normalized, 'https://logue.local');

    if (url.origin !== 'https://logue.local') return null;
    if (url.pathname !== ONBOARDING_PATH && !isPrivatePath(url.pathname)) {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function getPostAuthRedirectPath(
  pathname: string,
  nextPath?: string | null,
) {
  const normalizedNextPath = normalizeAuthNextPath(nextPath);

  if (normalizedNextPath) return normalizedNextPath;
  if (pathname === ONBOARDING_PATH) return ONBOARDING_PATH;
  if (shouldRedirectAuthenticatedUser(pathname)) return AUTH_REDIRECT_PATH;

  return pathname;
}
