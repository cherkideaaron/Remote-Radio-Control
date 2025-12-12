import { NextResponse } from "next/server"
import { BACKEND_URL } from "@/lib/backend"

export async function GET() {
  return NextResponse.json({
    backendUrl: BACKEND_URL,
    envVar: process.env.NEXT_PUBLIC_BACKEND_URL || "not set",
    default: "http://localhost:5000",
  })
}

