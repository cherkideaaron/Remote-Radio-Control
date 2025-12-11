import { NextResponse } from "next/server"
import { postToBackend } from "@/lib/backend"

const BAND_MAP: Record<string, string> = {
  "160m": "160",
  "80m": "80",
  "40m": "40",
  "30m": "30",
  "20m": "20",
  "17m": "17",
  "15m": "15",
  "12m": "12",
  "10m": "10",
  "6m": "6",
}

const ALLOWED_BANDS = Object.values(BAND_MAP)

export async function POST(request: Request) {
  try {
    const { band } = await request.json()
    const rawBand = String(band || "").trim()
    const backendBand = BAND_MAP[rawBand] ?? rawBand

    if (!ALLOWED_BANDS.includes(backendBand)) {
      return NextResponse.json(
        { success: false, error: `Invalid band. Allowed: ${ALLOWED_BANDS.join(", ")}` },
        { status: 400 },
      )
    }

    const backendResponse = await postToBackend<{ status: string }>({
      path: "/band",
      body: { band: backendBand },
    })

    return NextResponse.json({ success: true, band: backendBand, backend: backendResponse })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to set band"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
