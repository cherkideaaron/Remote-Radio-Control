"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mic, Square, Radio } from "lucide-react"

export function PTTButton() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      setRecordingTime(0)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording])

  const handleStart = () => {
    setIsRecording(true)
    // TODO: Start PTT transmission
    // await fetch('/api/ptt/start', { method: 'POST' })
  }

  const handleStop = () => {
    setIsRecording(false)
    // TODO: Stop PTT transmission
    // await fetch('/api/ptt/stop', { method: 'POST' })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Mic className="w-5 h-5 text-primary" />
          Push-to-Talk
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        {/* PTT Button */}
        <div className="relative">
          {isRecording && <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />}
          <button
            onClick={isRecording ? handleStop : handleStart}
            className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all ${
              isRecording
                ? "bg-accent text-accent-foreground shadow-lg shadow-accent/30 scale-105"
                : "bg-secondary hover:bg-secondary/80 text-foreground"
            }`}
          >
            {isRecording ? (
              <>
                <Radio className="w-10 h-10 mb-1 animate-pulse" />
                <span className="text-xs font-medium">TX</span>
              </>
            ) : (
              <>
                <Mic className="w-10 h-10 mb-1" />
                <span className="text-xs font-medium">PTT</span>
              </>
            )}
          </button>
        </div>

        {/* Recording indicator */}
        {isRecording && (
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-mono text-accent">{formatTime(recordingTime)}</span>
          </div>
        )}

        {/* Stop button when recording */}
        {isRecording && (
          <Button
            onClick={handleStop}
            variant="outline"
            className="w-full border-accent text-accent hover:bg-accent/10 bg-transparent"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop Transmission
          </Button>
        )}

        <p className="text-xs text-muted-foreground text-center">
          {isRecording ? "Transmitting... Click the button or Stop to finish" : "Click to start transmitting"}
        </p>
      </CardContent>
    </Card>
  )
}
