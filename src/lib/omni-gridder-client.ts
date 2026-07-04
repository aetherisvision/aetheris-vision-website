import { getOgServerIdToken } from './omni-gridder-auth'

const OG_SERVER_URL = process.env.OG_SERVER_URL
const OG_SERVER_API_KEY = process.env.OG_SERVER_API_KEY

export interface OmniGridderJobSpec {
  job_id: string
  processor_type: 'fetch' | 'regrid' | 'stitch' | 'plot'
  kind: string
  input_uri: string
  output_uri: string
  params: Record<string, unknown>
}

export interface OmniGridderJobStatus {
  job_id: string
  processor_type: string
  status: 'queued' | 'processing' | 'succeeded' | 'failed'
  submitted_at: number
  result_uri: string | null
  error_message: string | null
}

async function ogFetch(path: string, init?: RequestInit): Promise<Response> {
  if (!OG_SERVER_URL) throw new Error('OG_SERVER_URL is not set')
  if (!OG_SERVER_API_KEY) throw new Error('OG_SERVER_API_KEY is not set')

  // og-server the app requires X-Api-Key for tenant identification and rate
  // limiting; Cloud Run's own IAM layer (checked before the request even
  // reaches the app) requires a separate audience-scoped Google ID token —
  // these are two independent auth layers, not redundant.
  const idToken = await getOgServerIdToken(OG_SERVER_URL)

  return fetch(`${OG_SERVER_URL}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${idToken}`,
      'X-Api-Key': OG_SERVER_API_KEY,
    },
  })
}

export async function submitJob(spec: OmniGridderJobSpec): Promise<void> {
  const res = await ogFetch('/v1/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ spec }),
  })
  // A 409-style "already exists" is expected and harmless when re-chaining
  // a follow-on job across repeated status polls — every other failure is
  // a real problem and should surface.
  if (!res.ok && res.status !== 409) {
    const body = await res.text()
    throw new Error(`submitJob failed (${res.status}): ${body}`)
  }
}

export async function getJobStatus(jobId: string): Promise<OmniGridderJobStatus | null> {
  const res = await ogFetch(`/v1/jobs/${encodeURIComponent(jobId)}`)
  if (res.status === 404) return null
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`getJobStatus failed (${res.status}): ${body}`)
  }
  return (await res.json()) as OmniGridderJobStatus
}
