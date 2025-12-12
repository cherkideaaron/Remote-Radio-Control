const DEFAULT_BACKEND_URL = "http://localhost:5000"

export const BACKEND_URL = process.env.BACKEND_URL || DEFAULT_BACKEND_URL

interface PostOptions<TBody> {
  path: string
  body?: TBody
}

/**
 * Helper to POST JSON to the Flask backend and bubble up readable errors.
 */
export async function postToBackend<TResponse, TBody = unknown>({ path, body }: PostOptions<TBody>) {
  const target = `${BACKEND_URL}${path}`
  const response = await fetch(target, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = typeof data?.error === "string" ? data.error : `Backend error (${response.status})`
    throw new Error(message)
  }

  return data as TResponse
}

export async function postFormDataToBackend<TResponse>({ path, formData }: { path: string; formData: FormData }) {
  const target = `${BACKEND_URL}${path}`
  
  let response: Response
  try {
    response = await fetch(target, {
      method: "POST",
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

