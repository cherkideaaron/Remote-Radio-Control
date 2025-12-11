import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { mode } = await request.json()

    // TODO: Connect to your actual radio control backend
    // Example: await fetch('http://your-radio-server/api/mode', {
    //   method: 'POST',
    //   body: JSON.stringify({ mode })
    // })

    console.log(`Setting mode to: ${mode}`)

    return NextResponse.json({ success: true, mode })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to set mode" }, { status: 500 })
  }
}
