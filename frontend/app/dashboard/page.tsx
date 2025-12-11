"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Radio, LogOut } from "lucide-react"
import { AudioStreamSection } from "@/components/dashboard/audio-stream-section"
import { FrequencyControl } from "@/components/dashboard/frequency-control"
import { ModeSelector } from "@/components/dashboard/mode-selector"
import { BandSelector } from "@/components/dashboard/band-selector"
import { PTTButton } from "@/components/dashboard/ptt-button"
import { AntennaCompass } from "@/components/dashboard/antenna-compass"

export default function DashboardPage() {
  const router = useRouter()
  const [frequency, setFrequency] = useState(14.2) // MHz
  const [mode, setMode] = useState("USB")
  const [band, setBand] = useState("20m")
  const [antennaDirection, setAntennaDirection] = useState(0)

  const handleLogout = () => {
    document.cookie = "et3aa_auth=; path=/; max-age=0"
    router.push("/")
  }

  const handleFrequencyChange = useCallback(async (newFreq: number) => {
    setFrequency(newFreq)
    // TODO: Connect to setFrequency API
    // await fetch('/api/set-frequency', { method: 'POST', body: JSON.stringify({ frequency: newFreq }) })
  }, [])

  const handleModeChange = useCallback(async (newMode: string) => {
    setMode(newMode)
    // TODO: Connect to setMode API
    // await fetch('/api/set-mode', { method: 'POST', body: JSON.stringify({ mode: newMode }) })
  }, [])

  const handleBandChange = useCallback(async (newBand: string) => {
    setBand(newBand)
    // Map band to frequency
    const bandFrequencies: Record<string, number> = {
      "80m": 3.75,
      "40m": 7.15,
      "30m": 10.125,
      "20m": 14.2,
      "17m": 18.12,
      "15m": 21.2,
      "10m": 28.5,
      "6m": 50.15,
    }
    setFrequency(bandFrequencies[newBand] || 14.2)
    // TODO: Connect to setBand API
    // await fetch('/api/set-band', { method: 'POST', body: JSON.stringify({ band: newBand }) })
  }, [])

  const handleRotateAntenna = useCallback(async (direction: "cw" | "ccw") => {
    setAntennaDirection((prev) => {
      const change = direction === "cw" ? 5 : -5
      const newDir = (prev + change + 360) % 360
      return newDir
    })
    // TODO: Connect to rotate APIs
    // await fetch(`/api/rotate_${direction}`, { method: 'POST' })
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
              <Radio className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="text-lg font-bold text-foreground">ET3AA</span>
              <span className="text-xs text-muted-foreground ml-2">Remote Station</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-muted-foreground">Connected</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Audio & Frequency */}
          <div className="lg:col-span-2 space-y-6">
            <AudioStreamSection />
            <FrequencyControl frequency={frequency} onFrequencyChange={handleFrequencyChange} />
            <ModeSelector selectedMode={mode} onModeChange={handleModeChange} />
            <BandSelector selectedBand={band} onBandChange={handleBandChange} />
          </div>

          {/* Right Column - PTT & Antenna */}
          <div className="space-y-6">
            <PTTButton />
            <AntennaCompass direction={antennaDirection} onRotate={handleRotateAntenna} />
          </div>
        </div>
      </main>
    </div>
  )
}
