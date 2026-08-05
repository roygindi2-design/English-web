import { NextResponse } from 'next/server';
import { buildHealthReport } from '@/lib/core/health';

export const dynamic = 'force-dynamic';

export async function GET() {
  const report = buildHealthReport({
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasSupabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    allowPlaceholderContent: process.env.NEXT_PUBLIC_ALLOW_PLACEHOLDER === 'true',
  });

  return NextResponse.json(report, { status: report.ok ? 200 : 503 });
}
