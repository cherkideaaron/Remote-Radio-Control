import { NextResponse } from "next/server"
import { postToBackend } from "@/lib/backend"

export async function POST() {
  try {
    const backendResponse = await postToBackend<{ status: string }>({ path: "/rotate_ccw" })
    return NextResponse.json({ success: true, direction: "ccw", backend: backendResponse })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to rotate antenna"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
