import {
  AUTH_REDIRECT_PATH,
  getLoginRedirectPath,
  shouldRedirectAuthenticatedUser,
  shouldRedirectPrivatePath,
  type AuthStatus,
} from './authSession';

export type AuthRouteDecision =
  | { type: 'none' }
  | { type: 'replace'; path: string };

export type AuthRouteBypassRequirements = {
  authEntry: boolean;
  privatePath: boolean;
};

type GetAuthRouteDecisionParams = {
  currentUrl: URL;
  pathname: string;
  shouldBypassAuthEntryRedirect: boolean;
  shouldBypassPrivatePathRedirect: boolean;
  shouldCheckAuthEntryRedirect: boolean;
  status: AuthStatus;
};

export function getAuthRouteBypassRequirements({
  pathname,
  shouldCheckAuthEntryRedirect,
  status,
}: Pick<
  GetAuthRouteDecisionParams,
  'pathname' | 'shouldCheckAuthEntryRedirect' | 'status'
>): AuthRouteBypassRequirements {
  return {
    authEntry:
      status === 'authenticated' &&
      shouldCheckAuthEntryRedirect &&
      shouldRedirectAuthenticatedUser(pathname),
    privatePath: shouldRedirectPrivatePath(status, pathname),
  };
}

export function getAuthRouteDecision({
  currentUrl,
  pathname,
  shouldBypassAuthEntryRedirect,
  shouldBypassPrivatePathRedirect,
  shouldCheckAuthEntryRedirect,
  status,
}: GetAuthRouteDecisionParams): AuthRouteDecision {
  if (
    shouldRedirectPrivatePath(status, pathname) &&
    !shouldBypassPrivatePathRedirect
  ) {
    return {
      type: 'replace',
      path: getLoginRedirectPath(currentUrl),
    };
  }

  if (
    status === 'authenticated' &&
    shouldCheckAuthEntryRedirect &&
    shouldRedirectAuthenticatedUser(pathname) &&
    !shouldBypassAuthEntryRedirect
  ) {
    return {
      type: 'replace',
      path: AUTH_REDIRECT_PATH,
    };
  }

  return { type: 'none' };
}
