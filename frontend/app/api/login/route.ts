import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    // Query Supabase Users table
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("Users")
      .select("email, password")
      .eq("email", email.toLowerCase().trim())
      .single()

    if (error || !data) {
      console.error("Supabase query error:", error)
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
    }

    // Compare passwords (plain text as requested)
    if (data.password !== password) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
    }

    // Authentication successful - set cookie
    const response = NextResponse.json({ success: true, message: "Authentication successful" })
    response.cookies.set("et3aa_auth", "authenticated", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    const message = error instanceof Error ? error.message : "Authentication failed"
    return NextResponse.json({ success: false, error: message }, { status: 401 })
  }
}

