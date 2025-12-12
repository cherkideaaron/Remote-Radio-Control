import { NextResponse } from "next/server"
import { postToBackend } from "@/lib/backend"

export async function POST() {
  try {
    console.log("[API] Rotating antenna CW")
    const backendResponse = await postToBackend<{ status: string }>({ path: "/rotate_cw" })
    console.log("[API] Rotation successful:", backendResponse)
    return NextResponse.json({ success: true, direction: "cw", backend: backendResponse })
  } catch (error) {
    console.error("[API] Rotation error:", error)
    const message = error instanceof Error ? error.message : "Failed to rotate antenna"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
