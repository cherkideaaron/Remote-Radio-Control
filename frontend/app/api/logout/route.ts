import { NextResponse } from "next/server"

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" })
  
  // Clear the authentication cookie
  response.cookies.set("et3aa_auth", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0), // Set to epoch time to delete
    maxAge: 0,
  })
  
  return response
}

