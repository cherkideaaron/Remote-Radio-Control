"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Volume2, VolumeX } from "lucide-react"
import { BACKEND_URL } from "@/lib/backend"

export function AudioStreamSection() {
  const [isOn, setIsOn] = useState(false)
  const [volume, setVolume] = useState(75)
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(0))
  const animationRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Drive visualization (simple simulated levels based on volume/on state)
  useEffect(() => {
    const animate = () => {
      if (isOn && volume > 0) {
        setAudioLevels((prev) => prev.map(() => Math.random() * 100 * (volume / 100)))
      } else {
        setAudioLevels(Array(20).fill(0))
      }
      animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [isOn, volume])

  // Apply volume to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  const toggleAudio = async (checked: boolean) => {
    setIsOn(checked)
    const audioEl = audioRef.current
    if (!audioEl) return

    if (checked) {
      // Use Next.js API route to proxy the stream (avoids CORS issues)
      const streamUrl = `/api/audio-stream?t=${Date.now()}`
      console.log("🎵 Loading audio stream via API proxy...")
      
      audioEl.src = streamUrl
      try {
        await audioEl.play()
        console.log("✅ Audio stream started successfully")
      } catch (e) {
        console.error("❌ Audio playback error:", e)
        console.error("Error details:", e instanceof Error ? e.message : String(e))
        
        // Reset the toggle on error
        setIsOn(false)
        
        // Show user-friendly error
        if (e instanceof Error) {
          if (e.name === "NotSupportedError") {
            alert(`Audio stream failed to load.\n\nPossible causes:\n1. Backend audio stream is not running\n2. Check backend console for errors\n3. Try refreshing the page`)
          } else if (e.name === "NotAllowedError") {
            alert("Autoplay blocked by browser. Click the toggle again to enable audio.")
          }
        }
      }
    } else {
      audioEl.pause()
      audioEl.src = ""
      console.log("🔇 Audio stream stopped")
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {isOn ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
          Audio Stream
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <audio ref={audioRef} style={{ display: "none" }} />

        {/* Audio Visualization */}
        <div className="h-24 bg-secondary rounded-lg p-3 flex items-end justify-center gap-1">
          {audioLevels.map((level, i) => (
            <div
              key={i}
              className="w-2 rounded-full transition-all duration-75"
              style={{
                height: `${level}%`,
                backgroundColor:
                  level === 0
                    ? "oklch(0.3 0.02 250)"
                    : level > 80
                      ? "oklch(0.65 0.18 30)"
                      : level > 50
                        ? "oklch(0.75 0.15 85)"
                        : "oklch(0.55 0.15 150)",
                minHeight: "4px",
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          {/* Audio On Checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox id="audio-on" checked={isOn} onCheckedChange={(checked) => toggleAudio(Boolean(checked))} />
            <Label htmlFor="audio-on" className="text-sm cursor-pointer">
              {isOn ? "Audio On" : "Enable Audio"}
            </Label>
          </div>

          {/* Volume Slider */}
          <div className="flex-1 flex items-center gap-3">
            <VolumeX className="w-4 h-4 text-muted-foreground" />
            <Slider value={[volume]} onValueChange={(v) => setVolume(v[0])} max={100} step={1} className="flex-1" />
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground w-10 text-right">{volume}%</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Toggle audio to hear the server output. Volume control is local only.
        </p>
      </CardContent>
    </Card>
  )
}
