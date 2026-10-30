import { describe, expect, it } from 'vitest'
import { forecastCsv, type WeatherSnapshot } from '../../src/lib/weather-demo'
describe('weather export', () => {
  it('preserves source timestamps, zero precipitation and missing precipitation separately', () => {
    const data: WeatherSnapshot = { location: { name: 'Denton' }, retrievedAt: '2026-10-21T12:00:00Z', errors: {}, sources: {
      noaa: { name: 'NOAA', url: 'https://weather.gov', issuedAt: '2026-10-21T11:00:00Z', points: [{ time: '2026-10-21T13:00:00Z', temperatureF: 70, precipitationProbability: 0 }] },
      ecmwf: { name: 'ECMWF', url: 'https://ecmwf.int', issuedAt: '2026-10-21T00:00:00Z', points: [{ time: '2026-10-21T12:00:00Z', temperatureF: 68.123 }] },
    } }
    const rows = forecastCsv(data).split('\n')
    expect(rows[1]).toBe('noaa,2026-10-21T11:00:00Z,2026-10-21T13:00:00Z,70.00,0')
    expect(rows[2]).toBe('ecmwf,2026-10-21T00:00:00Z,2026-10-21T12:00:00Z,68.12,')
  })
})
