import { NextResponse } from "next/server"
import { BACKEND_URL } from "@/lib/backend"

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/mode`, { cache: "no-store" })
    const data = await response.json()

    if (!response.ok) {
      const message = typeof data?.error === "string" ? data.error : `Backend error (${response.status})`
      return NextResponse.json({ success: false, error: message }, { status: response.status })
    }

    return NextResponse.json({ success: true, backend: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch mode"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}


