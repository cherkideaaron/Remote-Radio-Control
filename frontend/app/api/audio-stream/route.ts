import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"
  const streamUrl = `${backendUrl}/stream.wav`
  
  console.log(`[Audio Stream] Proxying audio from: ${streamUrl}`)
  
  try {
    const response = await fetch(streamUrl, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    })
    
    if (!response.ok) {
      console.error(`[Audio Stream] Backend returned ${response.status}`)
      return new Response("Audio stream not available", { status: 502 })
    }
    
    if (!response.body) {
      console.error(`[Audio Stream] No response body`)
      return new Response("No audio stream", { status: 502 })
    }
    
    console.log(`[Audio Stream] Successfully connected to backend, streaming audio...`)
    
    // Return the stream with proper headers
    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error(`[Audio Stream] Error connecting to backend:`, error)
    const message = error instanceof Error ? error.message : "Failed to connect to backend"
    return new Response(`Audio stream error: ${message}`, { status: 502 })
  }
}
