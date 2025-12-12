import { NextResponse } from "next/server"
import { postToBackend } from "@/lib/backend"

const MODE_MAP: Record<string, number> = {
  LSB: 0x00,
  USB: 0x01,
  AM: 0x02,
  CW: 0x03,
  RTTY: 0x04,
  FM: 0x05,
  WFM: 0x06,
  "CW-R": 0x07,
  "RTTY-R": 0x08,
  DATA: 0x17,
}

export async function POST(request: Request) {
  try {
    const { mode, filter = 1 } = await request.json()
    const normalizedMode = String(mode || "").trim().toUpperCase()

    console.log(`[API] Setting mode to: ${normalizedMode}`)

    // Special case: allow passing the literal "data" toggle through to backend.
    if (normalizedMode === "DATA") {
      const backendResponse = await postToBackend<{ status: string; data_mode?: number }>({
        path: "/mode",
        body: { mode: "data" },
      })
      console.log(`[API] Data mode toggled:`, backendResponse)
      return NextResponse.json({ success: true, mode: "data", backend: backendResponse })
    }

    const backendMode = MODE_MAP[normalizedMode]

    if (backendMode === undefined) {
      return NextResponse.json(
        { success: false, error: `Invalid mode. Allowed: ${Object.keys(MODE_MAP).join(", ")}` },
        { status: 400 },
      )
    }

    const backendResponse = await postToBackend<{ status: string }>({
      path: "/mode",
      body: { mode: backendMode, filter: Number(filter) || 1 },
    })

    console.log(`[API] Mode set successfully:`, backendResponse)
    return NextResponse.json({ success: true, mode: backendMode, backend: backendResponse })
  } catch (error) {
    console.error("[API] Mode set error:", error)
    const message = error instanceof Error ? error.message : "Failed to set mode"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
