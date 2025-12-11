import { NextResponse } from "next/server"
import { postToBackend } from "@/lib/backend"

export async function POST(request: Request) {
  try {
    const { frequency } = await request.json()
    const frequencyMhz = Number(frequency)

    if (!Number.isFinite(frequencyMhz) || frequencyMhz <= 0) {
      return NextResponse.json({ success: false, error: "Invalid frequency value" }, { status: 400 })
    }

    const frequency_hz = Math.round(frequencyMhz * 1_000_000)

    const backendResponse = await postToBackend<{ status: string }>({
      path: "/frequency",
      body: { frequency_hz },
    })

    return NextResponse.json({ success: true, frequency_hz, backend: backendResponse })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to set frequency"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
