import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { frequency } = await request.json()

    // TODO: Connect to your actual radio control backend
    // Example: await fetch('http://your-radio-server/api/frequency', {
    //   method: 'POST',
    //   body: JSON.stringify({ frequency })
    // })

    console.log(`Setting frequency to: ${frequency} MHz`)

    return NextResponse.json({ success: true, frequency })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to set frequency" }, { status: 500 })
  }
}
