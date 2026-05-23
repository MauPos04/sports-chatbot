import { NextResponse } from 'next/server'

import { getSportsNews } from '@/app/lib/sports-news'

export async function GET() {
  return NextResponse.json(await getSportsNews(10))
}

export const dynamic = 'force-dynamic'
