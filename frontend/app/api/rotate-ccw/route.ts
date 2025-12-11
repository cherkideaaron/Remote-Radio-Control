import { NextResponse } from "next/server"

export async function POST() {
  try {
    // TODO: Connect to your actual antenna rotator backend
    // Example: await fetch('http://your-rotator-server/api/rotate_ccw', {
    //   method: 'POST'
    // })

    console.log("Rotating antenna counter-clockwise")

    return NextResponse.json({ success: true, direction: "ccw" })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to rotate antenna" }, { status: 500 })
  }
}
