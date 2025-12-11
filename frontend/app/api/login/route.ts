import { NextResponse } from "next/server"
import { postToBackend } from "@/lib/backend"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    const backendResponse = await postToBackend<{ status: string }>({
      path: "/login",
      body: { email, password },
    })

    const response = NextResponse.json({ success: true, backend: backendResponse })
    response.cookies.set("et3aa_auth", "authenticated", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    })

    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed"
    return NextResponse.json({ success: false, error: message }, { status: 401 })
  }
}

