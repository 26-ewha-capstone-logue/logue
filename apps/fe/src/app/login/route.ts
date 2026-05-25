import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  getOAuthCallbackRedirectUrl,
  getOAuthLoginUrl,
} from '@/lib/authRedirect';
import {
  AUTH_NEXT_SEARCH_PARAM,
  normalizeAuthNextPath,
} from '@/lib/authSession';

const POST_AUTH_NEXT_COOKIE = 'logue:post-auth-next';
const POST_AUTH_NEXT_COOKIE_MAX_AGE_SECONDS = 10 * 60;

export function GET(request: NextRequest) {
  const storedNextPath = request.cookies.get(POST_AUTH_NEXT_COOKIE)?.value;
  const callbackRedirectUrl = getOAuthCallbackRedirectUrl(
    request.nextUrl,
    storedNextPath,
  );

  if (callbackRedirectUrl) {
    const response = NextResponse.redirect(callbackRedirectUrl);
    response.cookies.delete(POST_AUTH_NEXT_COOKIE);
    return response;
  }

  const response = NextResponse.redirect(getOAuthLoginUrl());
  const nextPath = normalizeAuthNextPath(
    request.nextUrl.searchParams.get(AUTH_NEXT_SEARCH_PARAM),
  );

  if (nextPath) {
    response.cookies.set(POST_AUTH_NEXT_COOKIE, nextPath, {
      httpOnly: true,
      maxAge: POST_AUTH_NEXT_COOKIE_MAX_AGE_SECONDS,
      path: '/',
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
    });
  } else {
    response.cookies.delete(POST_AUTH_NEXT_COOKIE);
  }

  return response;
}
