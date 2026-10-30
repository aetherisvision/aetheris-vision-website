import { readFile } from 'node:fs/promises'
import path from 'node:path'

export type ForecastPoint = { time: string; temperatureF: number; wind?: string; description?: string; precipitationProbability?: number | null; gridLatitude?: number; gridLongitude?: number; distanceKm?: number }
export type ForecastSource = { name: string; url: string; issuedAt: string; points: ForecastPoint[]; resolution?: string; attribution?: string }
export type WeatherSnapshot = { location: { name: string }; retrievedAt: string; evaluatedAt?: number; sources: Record<string, ForecastSource>; errors: Record<string, string> }
export async function readWeatherSnapshot(): Promise<WeatherSnapshot | null> {
  try { return { ...JSON.parse(await readFile(path.join(process.cwd(), '.weather-demo/forecast.json'), 'utf8')), evaluatedAt: Date.now() } }
  catch { return null }
}
export function forecastCsv(snapshot: WeatherSnapshot) {
  const rows = ['source,issued_at,valid_time,temperature_f,precipitation_probability_pct']
  for (const [key, source] of Object.entries(snapshot.sources)) for (const p of source.points) {
    rows.push([key, source.issuedAt, p.time, p.temperatureF.toFixed(2), p.precipitationProbability ?? ''].join(','))
  }
  return rows.join('\n')
}
