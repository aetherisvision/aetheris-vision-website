import { getVercelOidcToken } from '@vercel/oidc'
import { ExternalAccountClient, type BaseExternalAccountClient } from 'google-auth-library'

/**
 * Builds the WIF-federated auth client used to impersonate
 * omni-gridder-website-wif. Shared by both the ID-token path (og-server
 * invocation) and the raw access-token path (any other Google API call the
 * impersonated SA happens to be authorized for — e.g. Cloud Run Admin API,
 * IF that SA has been granted an IAM role on the target resource, which is
 * NOT guaranteed — see getOgWorkerAccessToken()).
 *
 * Flow: Vercel issues a short-lived OIDC token for this deployment
 * (VERCEL_OIDC_TOKEN / x-vercel-oidc-token) -> exchanged via GCP Workload
 * Identity Federation for an access token impersonating a dedicated service
 * account (omni-gridder-website-wif, scoped to only invoke og-server) ->
 * that access token is used to call the IAM Service Account Credentials API's
 * generateIdToken, producing an ID token audienced to the Cloud Run service
 * URL, which Cloud Run's own IAM check requires (a plain OAuth access token
 * is not sufficient — Cloud Run only accepts audience-scoped ID tokens).
 *
 * Static service-account keys are blocked by org policy on this GCP project,
 * and the org also blocks making Cloud Run services public (allUsers), so
 * this WIF path is the only route that lets this codebase call og-server at
 * all — see the two failed attempts documented in git history before this.
 */
function buildWifAuthClient(): BaseExternalAccountClient {
  const projectNumber = requireEnv('GCP_PROJECT_NUMBER')
  const poolId = requireEnv('GCP_WORKLOAD_IDENTITY_POOL_ID')
  const providerId = requireEnv('GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID')
  const serviceAccountEmail = requireEnv('GCP_SERVICE_ACCOUNT_EMAIL')

  const authClient = ExternalAccountClient.fromJSON({
    type: 'external_account',
    audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
    subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
    token_url: 'https://sts.googleapis.com/v1/token',
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccountEmail}:generateAccessToken`,
    subject_token_supplier: {
      // Must NOT pass getVercelOidcToken directly: google-auth-library calls
      // the supplier with a context object containing its own `audience`
      // (the STS resource-name audience above), and getVercelOidcToken
      // treats a truthy `options.audience` as a request to mint a token for
      // a *different* custom audience via exchangeVercelOidcToken — silently
      // replacing the token's aud claim with the STS resource name instead
      // of Vercel's default (https://vercel.com/aetherisvision), which this
      // project's WIF provider ("allowed audiences" mode) expects. Calling
      // it with no arguments avoids that entirely.
      getSubjectToken: () => getVercelOidcToken(),
    },
  })
  if (!authClient) {
    throw new Error('Failed to construct ExternalAccountClient from WIF config')
  }
  return authClient
}

export async function getOgServerIdToken(audience: string): Promise<string> {
  const serviceAccountEmail = requireEnv('GCP_SERVICE_ACCOUNT_EMAIL')
  const authClient = buildWifAuthClient()

  const accessTokenResponse = await authClient.getAccessToken()
  const accessToken = accessTokenResponse.token
  if (!accessToken) {
    throw new Error('WIF token exchange returned no access token')
  }

  const idTokenRes = await fetch(
    `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccountEmail}:generateIdToken`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ audience, includeEmail: true }),
    },
  )
  if (!idTokenRes.ok) {
    const body = await idTokenRes.text()
    throw new Error(`generateIdToken failed (${idTokenRes.status}): ${body}`)
  }
  const { token } = (await idTokenRes.json()) as { token: string }
  return token
}

/**
 * Returns a raw OAuth access token for the omni-gridder-website-wif SA (the
 * same impersonation as getOgServerIdToken, minus the final ID-token mint).
 *
 * NOT verified to work for anything beyond og-server invocation. The SA was
 * provisioned "scoped to only invoke og-server" (see buildWifAuthClient
 * above) — calling Cloud Run Admin API's jobs:run with this token requires
 * the SA to additionally hold roles/run.invoker (or the narrower
 * `run.jobs.run` permission) on the og-worker Job resource specifically.
 * That grant has not been confirmed as of this change. Callers must treat a
 * 403 from googleapis.com here as an expected, non-fatal outcome — see
 * triggerWorkerRun() in omni-gridder-client.ts.
 */
export async function getOgWorkerAccessToken(): Promise<string> {
  const authClient = buildWifAuthClient()
  const accessTokenResponse = await authClient.getAccessToken()
  const accessToken = accessTokenResponse.token
  if (!accessToken) {
    throw new Error('WIF token exchange returned no access token')
  }
  return accessToken
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}
