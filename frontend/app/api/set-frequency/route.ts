import { NextResponse } from "next/server"
import { postToBackend, BACKEND_URL } from "@/lib/backend"

export async function POST(request: Request) {
  try {
    const { frequency } = await request.json()
    const frequencyMhz = Number(frequency)

    if (!Number.isFinite(frequencyMhz) || frequencyMhz <= 0) {
      return NextResponse.json({ success: false, error: "Invalid frequency value" }, { status: 400 })
    }

    const frequency_hz = Math.round(frequencyMhz * 1_000_000)

    console.log(`[API] Setting frequency to ${frequency_hz} Hz (${frequencyMhz} MHz)`)
    console.log(`[API] Backend URL: ${BACKEND_URL}`)

    const backendResponse = await postToBackend<{ status: string }>({
      path: "/frequency",
      body: { frequency_hz },
    })

    console.log(`[API] Frequency set successfully:`, backendResponse)
    return NextResponse.json({ success: true, frequency_hz, backend: backendResponse })
  } catch (error) {
    console.error("[API] Frequency set error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to set frequency"
    const detailedError = `Backend URL: ${BACKEND_URL}. Error: ${errorMessage}`
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      details: detailedError,
      backendUrl: BACKEND_URL 
    }, { status: 500 })
  }
}
