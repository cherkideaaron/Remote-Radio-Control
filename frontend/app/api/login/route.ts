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
    const normalizedEmail = email.toLowerCase().trim()
    
    // Use "Users" (capitalized) as that's how it was created in Supabase
    const { data, error } = await supabase
      .from("Users")
      .select("email, password")
      .eq("email", normalizedEmail)
      .maybeSingle()

    // Check for query errors (not just no rows)
    if (error) {
      console.error("Supabase query error:", error)
      console.error("Attempted email:", normalizedEmail)
      return NextResponse.json({ 
        success: false, 
        error: "Database error. Please try again later." 
      }, { status: 500 })
    }

    // Check if user exists
    if (!data) {
      console.log(`Login attempt with non-existent email: ${normalizedEmail}`)
      return NextResponse.json({ 
        success: false, 
        error: "Invalid email or password" 
      }, { status: 401 })
    }

    // Compare passwords (plain text as requested)
    if (data.password !== password) {
      console.log(`Login attempt with incorrect password for: ${normalizedEmail}`)
      return NextResponse.json({ 
        success: false, 
        error: "Invalid email or password" 
      }, { status: 401 })
    }
    
    console.log(`Successful login for: ${normalizedEmail}`)

    // Authentication successful - set session cookie (expires when browser closes)
    const response = NextResponse.json({ success: true, message: "Authentication successful" })
    response.cookies.set("et3aa_auth", "authenticated", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      // No maxAge means session cookie - expires when browser closes
      secure: process.env.NODE_ENV === "production", // Use secure in production
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    const message = error instanceof Error ? error.message : "Authentication failed"
    return NextResponse.json({ success: false, error: message }, { status: 401 })
  }
}

