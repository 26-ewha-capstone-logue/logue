import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  getOAuthCallbackRedirectUrl,
  getOAuthLoginUrl,
} from '@/lib/authRedirect';

export function GET(request: NextRequest) {
  const callbackRedirectUrl = getOAuthCallbackRedirectUrl(request.nextUrl);

  if (callbackRedirectUrl) {
    return NextResponse.redirect(callbackRedirectUrl);
  }

  return NextResponse.redirect(getOAuthLoginUrl());
}
