import { NextRequest, NextResponse } from 'next/server'
import { forecastCsv, readWeatherSnapshot } from '@/lib/weather-demo'
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') return new NextResponse(null, { status: 404 })
  const data = await readWeatherSnapshot()
  if (!data) return NextResponse.json({ error: 'Forecast not yet ingested' }, { status: 503 })
  if (request.nextUrl.searchParams.get('format') === 'csv') return new NextResponse(forecastCsv(data), { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="av-denton-forecast.csv"', 'Cache-Control': 'no-store' } })
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
}
