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
  const response = await fetch(target, {
    method: "POST",
    body: formData,
    cache: "no-store",
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = typeof data?.error === "string" ? data.error : `Backend error (${response.status})`
    throw new Error(message)
  }

  return data as TResponse
}

