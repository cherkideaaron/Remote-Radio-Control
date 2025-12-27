// app/api/logs/[id]/route.ts
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Type defined as Promise
) {
  try {
    // FIX: Await the params before accessing properties (Required in Next.js 15+)
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)

    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid log ID" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { call_sign } = body

    if (!call_sign) {
      return NextResponse.json(
        { success: false, error: "Call sign is required" },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // We try 'logs' first
    let result = await supabase
      .from("logs")
      .delete()
      .eq("id", id)
      .eq("call_sign", call_sign.trim().toUpperCase())
      .select()

    // Fallback logic if 'logs' doesn't exist (matching your other files)
    if (result.error && result.error.code === "PGRST116") {
      result = await supabase
        .from("Logs")
        .delete()
        .eq("id", id)
        .eq("call_sign", call_sign.trim().toUpperCase())
        .select()
    }

    if (result.error) {
      console.error("Supabase delete error:", result.error)
      return NextResponse.json(
        { success: false, error: result.error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}