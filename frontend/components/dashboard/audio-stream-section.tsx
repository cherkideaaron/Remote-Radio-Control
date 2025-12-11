"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Volume2, VolumeX } from "lucide-react"

export function AudioStreamSection() {
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(75)
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(0))
  const animationRef = useRef<number | null>(null)

  // Simulate audio visualization
  useEffect(() => {
    const animate = () => {
      if (!isMuted && volume > 0) {
        setAudioLevels((prev) => prev.map(() => Math.random() * 100 * (volume / 100)))
      } else {
        setAudioLevels(Array(20).fill(0))
      }
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isMuted, volume])

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Volume2 className="w-5 h-5 text-primary" />
          )}
          Audio Stream
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
          {/* Mute Checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox id="mute" checked={!isMuted} onCheckedChange={(checked) => setIsMuted(!checked)} />
            <Label htmlFor="mute" className="text-sm cursor-pointer">
              {isMuted ? "Unmute Audio" : "Audio On"}
            </Label>
          </div>

          {/* Volume Slider */}
          <div className="flex-1 flex items-center gap-3">
            <VolumeX className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[volume]}
              onValueChange={(v) => setVolume(v[0])}
              max={100}
              step={1}
              className="flex-1"
              disabled={isMuted}
            />
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground w-10 text-right">{volume}%</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Audio stream from the remote receiver. Volume control is local only.
        </p>
      </CardContent>
    </Card>
  )
}
