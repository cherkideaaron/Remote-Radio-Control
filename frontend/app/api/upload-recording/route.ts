import { NextResponse } from "next/server"
import { postFormDataToBackend } from "@/lib/backend"

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const backendResponse = await postFormDataToBackend<{ status: string; path?: string }>({
      path: "/upload_recording",
      formData: form,
    })
    return NextResponse.json({ success: true, backend: backendResponse })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload recording"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

