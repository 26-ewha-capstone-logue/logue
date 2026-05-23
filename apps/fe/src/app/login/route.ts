import { NextResponse } from 'next/server';
import { getOAuthLoginUrl } from '@/lib/authRedirect';

export function GET() {
  return NextResponse.redirect(getOAuthLoginUrl());
}
