const DEFAULT_BACKEND_URL = "http://localhost:5000"

// Next.js requires NEXT_PUBLIC_ prefix for client-side environment variables
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || DEFAULT_BACKEND_URL

// Log the backend URL on module load (server-side only)
if (typeof window === "undefined") {
  console.log(`[Backend Config] BACKEND_URL: ${BACKEND_URL}`)
  console.log(`[Backend Config] NEXT_PUBLIC_BACKEND_URL: ${process.env.NEXT_PUBLIC_BACKEND_URL || "not set"}`)
  if (BACKEND_URL === DEFAULT_BACKEND_URL) {
    console.warn(`[Backend Config] ⚠️ Using default backend URL (localhost:5000). Set NEXT_PUBLIC_BACKEND_URL in .env.local if backend is on a different machine.`)
  }
}

interface PostOptions<TBody> {
  path: string
  body?: TBody
}

/**
 * Helper to POST JSON to the Flask backend and bubble up readable errors.
 */
export async function postToBackend<TResponse, TBody = unknown>({ path, body }: PostOptions<TBody>) {
  const target = `${BACKEND_URL}${path}`
  console.log(`[Backend] POST to: ${target}`, body ? { body } : "")
  
  const headers: HeadersInit = { "Content-Type": "application/json" }
  // Skip ngrok browser warning if using ngrok
  if (BACKEND_URL.includes("ngrok")) {
    headers["ngrok-skip-browser-warning"] = "true"
  }
  
  let response: Response
  try {
    response = await fetch(target, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    })
  } catch (networkError) {
    console.error(`[Backend] Network error connecting to ${target}:`, networkError)
    const message = networkError instanceof Error ? networkError.message : "Network error"
    throw new Error(`Failed to connect to backend at ${BACKEND_URL}: ${message}`)
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    console.error(`[Backend] Error response from ${target}:`, response.status, data)
    const message = typeof data?.error === "string" ? data.error : `Backend error (${response.status})`
    throw new Error(message)
  }

  console.log(`[Backend] Success from ${target}:`, data)
  return data as TResponse
}

export async function postFormDataToBackend<TResponse>({ path, formData }: { path: string; formData: FormData }) {
  const target = `${BACKEND_URL}${path}`
  
  let response: Response
  try {
    const headers: HeadersInit = {}
    // Skip ngrok browser warning if using ngrok
    if (BACKEND_URL.includes("ngrok")) {
      headers["ngrok-skip-browser-warning"] = "true"
    }
    response = await fetch(target, {
      method: "POST",
      headers,
      body: formData,
      cache: "no-store",
    })
  } catch (networkError) {
    // Network error (CORS, connection refused, etc.)
    const message = networkError instanceof Error ? networkError.message : "Network error - check if backend is running"
    throw new Error(`Failed to connect to backend: ${message}`)
  }

  let data: any = {}
  try {
    const text = await response.text()
    if (text) {
      data = JSON.parse(text)
    }
  } catch (parseError) {
    // If response isn't JSON, use status text
    throw new Error(`Backend returned non-JSON response (${response.status}): ${response.statusText}`)
  }

  if (!response.ok) {
    const message = typeof data?.error === "string" ? data.error : typeof data?.message === "string" ? data.message : `Backend error (${response.status})`
    throw new Error(message)
  }

  return data as TResponse
}

