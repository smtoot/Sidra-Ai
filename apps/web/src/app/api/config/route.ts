import { NextResponse } from 'next/server';

/**
 * Runtime configuration endpoint
 * Returns public environment variables to the client
 */
export async function GET() {
  return NextResponse.json({
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    jitsiEnabled: process.env.NEXT_PUBLIC_JITSI_ENABLED === 'true',
    jitsiDomain: process.env.NEXT_PUBLIC_JITSI_DOMAIN || '',
  });
}

/**
 * Cache configuration for 5 minutes
 * This reduces load while still allowing updates without rebuilding
 */
export const revalidate = 300;
