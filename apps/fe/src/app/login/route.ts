import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/apiBaseUrl';

export function GET() {
  return NextResponse.redirect(
    new URL('/oauth2/authorization/google', getApiBaseUrl()),
  );
}
