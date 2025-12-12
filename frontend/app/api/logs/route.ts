import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// GET all logs
export async function GET() {
  try {
    const supabase = createServerClient()
    
    // Try common table names - adjust if your table has a different name
    let tableName = "logs"
    let data, error
    
    // Try "logs" first
    let result = await supabase
      .from("logs")
      .select("*")
      .order("date_time", { ascending: false })
      .limit(100)
    
    data = result.data
    error = result.error
    
    // If "logs" doesn't exist, try "Logs" (capitalized)
    if (error && error.code === "PGRST116") {
      result = await supabase
        .from("Logs")
        .select("*")
        .order("date_time", { ascending: false })
        .limit(100)
      data = result.data
      error = result.error
      tableName = "Logs"
    }

    if (error) {
      console.error("Supabase query error:", error)
      return NextResponse.json(
        { success: false, error: "Failed to fetch logs" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, logs: data || [] })
  } catch (error) {
    console.error("Error fetching logs:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch logs" },
      { status: 500 }
    )
  }
}

// POST new log
export async function POST(request: Request) {
  try {
    const { frequency, call_sign, report } = await request.json()

    if (!call_sign || !call_sign.trim()) {
      return NextResponse.json(
        { success: false, error: "Call sign is required" },
        { status: 400 }
      )
    }

    if (!frequency || frequency <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid frequency is required" },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    
    // Try common table names - adjust if your table has a different name
    let tableName = "logs"
    let data, error
    
    // Try "logs" first
    let result = await supabase
      .from("logs")
      .insert({
        frequency: Number(frequency),
        call_sign: call_sign.trim().toUpperCase(),
        report: report?.trim() || "",
        date_time: new Date().toISOString(),
      })
      .select()
      .single()
    
    data = result.data
    error = result.error
    
    // If "logs" doesn't exist, try "Logs" (capitalized)
    if (error && error.code === "PGRST116") {
      result = await supabase
        .from("Logs")
        .insert({
          frequency: Number(frequency),
          call_sign: call_sign.trim().toUpperCase(),
          report: report?.trim() || "",
          date_time: new Date().toISOString(),
        })
        .select()
        .single()
      data = result.data
      error = result.error
      tableName = "Logs"
    }

    if (error) {
      console.error("Supabase insert error:", error)
      return NextResponse.json(
        { success: false, error: "Failed to save log" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, log: data })
  } catch (error) {
    console.error("Error saving log:", error)
    return NextResponse.json(
      { success: false, error: "Failed to save log" },
      { status: 500 }
    )
  }
}

