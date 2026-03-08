/**
 * Spotify OAuth 2.0 with PKCE (no client secret).
 * @see https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
 */

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"

const STORAGE_KEYS = {
  accessToken: "spotify_access_token",
  refreshToken: "spotify_refresh_token",
  expiresAt: "spotify_expires_at",
  codeVerifier: "spotify_code_verifier",
  state: "spotify_auth_state",
} as const

function getClientId(): string {
  const id = import.meta.env.VITE_SPOTIFY_CLIENT_ID
  if (!id) throw new Error("VITE_SPOTIFY_CLIENT_ID is not set")
  return id
}

function getRedirectUri(): string {
  const uri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI
  if (uri) return uri
  if (typeof window !== "undefined") return `${window.location.origin}/callback`
  return "http://localhost:3000/callback"
}

function generateRandomString(length: number): string {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const values = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(values, (x) => possible[x % possible.length]).join("")
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return crypto.subtle.digest("SHA-256", data)
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

/** Generate code verifier and challenge for PKCE. */
export async function generateCodeChallenge(): Promise<{
  codeVerifier: string
  codeChallenge: string
}> {
  const codeVerifier = generateRandomString(64)
  const hashed = await sha256(codeVerifier)
  const codeChallenge = base64UrlEncode(hashed)
  return { codeVerifier, codeChallenge }
}

/** Redirect the user to Spotify to log in. Call this to start the auth flow. */
export async function login(scope = "user-read-private user-read-email"): Promise<void> {
  const clientId = getClientId()
  const redirectUri = getRedirectUri()
  const state = generateRandomString(32)
  const { codeVerifier, codeChallenge } = await generateCodeChallenge()

  if (typeof window !== "undefined") {
    sessionStorage.setItem(STORAGE_KEYS.codeVerifier, codeVerifier)
    sessionStorage.setItem(STORAGE_KEYS.state, state)
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope,
    redirect_uri: redirectUri,
    state,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  })
  const url = `${SPOTIFY_AUTH_URL}?${params.toString()}`
  if (typeof window !== "undefined") {
    window.location.href = url
  }
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope?: string
}

/**
 * Exchange the authorization code (from callback URL) for tokens.
 * Call this on the /callback page with the `code` and `state` from the URL.
 */
export async function exchangeCodeForTokens(
  code: string,
  state: string,
): Promise<TokenResponse> {
  const clientId = getClientId()
  const redirectUri = getRedirectUri()

  if (typeof window !== "undefined") {
    const savedState = sessionStorage.getItem(STORAGE_KEYS.state)
    if (savedState !== state) throw new Error("State mismatch")
    sessionStorage.removeItem(STORAGE_KEYS.state)
  }

  const codeVerifier =
    typeof window !== "undefined"
      ? sessionStorage.getItem(STORAGE_KEYS.codeVerifier)
      : null
  if (!codeVerifier) throw new Error("Missing code_verifier")

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token exchange failed: ${res.status} ${err}`)
  }

  const data = (await res.json()) as TokenResponse

  if (typeof window !== "undefined") {
    sessionStorage.removeItem(STORAGE_KEYS.codeVerifier)
    setStoredTokens(data)
  }

  return data
}

function setStoredTokens(data: TokenResponse): void {
  if (typeof window === "undefined") return
  const expiresAt = Date.now() + data.expires_in * 1000
  sessionStorage.setItem(STORAGE_KEYS.accessToken, data.access_token)
  sessionStorage.setItem(STORAGE_KEYS.expiresAt, String(expiresAt))
  if (data.refresh_token) {
    sessionStorage.setItem(STORAGE_KEYS.refreshToken, data.refresh_token)
  }
}

/**
 * Get a valid access token. Refreshes automatically if expired.
 * Returns null if not logged in or refresh fails.
 */
export async function getAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null
  const accessToken = sessionStorage.getItem(STORAGE_KEYS.accessToken)
  const expiresAt = sessionStorage.getItem(STORAGE_KEYS.expiresAt)
  const refreshToken = sessionStorage.getItem(STORAGE_KEYS.refreshToken)

  if (!accessToken) return null
  const expiresAtMs = expiresAt ? Number(expiresAt) : 0
  if (Date.now() < expiresAtMs - 60_000) return accessToken

  if (!refreshToken) return null
  const refreshed = await refreshAccessToken(refreshToken)
  return refreshed ? refreshed.access_token : null
}

/** Refresh the access token using the stored refresh token. */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenResponse | null> {
  const clientId = getClientId()
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  })
  if (!res.ok) return null
  const data = (await res.json()) as TokenResponse
  if (typeof window !== "undefined") setStoredTokens(data)
  return data
}

/** Clear stored tokens (log out). */
export function logout(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(STORAGE_KEYS.accessToken)
  sessionStorage.removeItem(STORAGE_KEYS.refreshToken)
  sessionStorage.removeItem(STORAGE_KEYS.expiresAt)
  sessionStorage.removeItem(STORAGE_KEYS.codeVerifier)
  sessionStorage.removeItem(STORAGE_KEYS.state)
}

/** Whether we have any stored token (may be expired). */
export function hasStoredToken(): boolean {
  if (typeof window === "undefined") return false
  return !!sessionStorage.getItem(STORAGE_KEYS.accessToken)
}
