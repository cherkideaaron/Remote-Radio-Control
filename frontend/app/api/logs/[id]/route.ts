import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// DELETE log by ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid log ID" },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    
    // Try common table names - adjust if your table has a different name
    let error
    
    // Try "logs" first
    let result = await supabase
      .from("logs")
      .delete()
      .eq("id", id)
    
    error = result.error
    
    // If "logs" doesn't exist, try "Logs" (capitalized)
    if (error && error.code === "PGRST116") {
      result = await supabase
        .from("Logs")
        .delete()
        .eq("id", id)
      error = result.error
    }

    if (error) {
      console.error("Supabase delete error:", error)
      return NextResponse.json(
        { success: false, error: "Failed to delete log" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting log:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete log" },
      { status: 500 }
    )
  }
}

