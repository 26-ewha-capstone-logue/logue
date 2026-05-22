import { NextResponse } from 'next/server';

const DEV_API_BASE_URL = 'https://api-stg.asklogue.co';
const GOOGLE_OAUTH_PATH = '/oauth2/authorization/google';

function getApiBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (apiUrl) return apiUrl;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_API_URL must be set in production');
  }

  return DEV_API_BASE_URL;
}

export function GET() {
  return NextResponse.redirect(new URL(GOOGLE_OAUTH_PATH, getApiBaseUrl()));
}
