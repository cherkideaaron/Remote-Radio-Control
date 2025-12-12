"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Radio, LogOut } from "lucide-react"
import { AudioStreamSection } from "@/components/dashboard/audio-stream-section"
import { FrequencyControl } from "@/components/dashboard/frequency-control"
import { ModeSelector } from "@/components/dashboard/mode-selector"
import { BandSelector } from "@/components/dashboard/band-selector"
import { PTTButton } from "@/components/dashboard/ptt-button"
import { AntennaCompass } from "@/components/dashboard/antenna-compass"

const BAND_TO_FREQ_MHZ: Record<string, number> = {
  "160m": 1.9,
  "80m": 3.75,
  "40m": 7.15,
  "30m": 10.12,
  "20m": 14.23,
  "17m": 18.13,
  "15m": 21.3,
  "12m": 24.95,
  "10m": 28.3,
  "6m": 50.125,
}

const ROTATION_STEP_DEG = 10

export default function DashboardPage() {
  const router = useRouter()
  const [frequency, setFrequency] = useState(14.23) // MHz
  const [baseMode, setBaseMode] = useState("USB")
  const [dataEnabled, setDataEnabled] = useState(false)
  const [band, setBand] = useState("20m")
  const [antennaDirection, setAntennaDirection] = useState(330)

  const handleLogout = async () => {
    try {
      // Call logout API to properly clear server-side cookie
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout error:", error)
    }
    // Clear client-side cookie as backup
    document.cookie = "et3aa_auth=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    // Hard redirect to login
    window.location.href = "/login"
  }

  const handleFrequencyChange = useCallback(async (newFreq: number) => {
    setFrequency(newFreq)
    try {
      const response = await fetch("/api/set-frequency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frequency: newFreq }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || "Failed to set frequency")
      }
    } catch (error) {
      console.error("Frequency update failed:", error)
    }
  }, [])

  const syncFromBackend = useCallback(async () => {
    try {
      const response = await fetch("/api/get-mode", { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.success) {
        console.warn("Mode sync skipped:", data?.error || `HTTP ${response.status}`)
        return
      }
      const backend = data.backend
      if (backend?.base_mode) {
        setBaseMode(backend.base_mode)
      } else if (backend?.mode_name) {
        // Fallback: parse base from mode_name like "USB-D1"
        setBaseMode(String(backend.mode_name).split("-")[0])
      }
      setDataEnabled((backend?.data_mode || 0) > 0)
    } catch (error) {
      console.error("Sync mode failed:", error)
    }
  }, [])

  useEffect(() => {
    void syncFromBackend()
  }, [syncFromBackend])

  const handleModeChange = useCallback(
    async (newMode: string) => {
      setBaseMode(newMode)
      try {
        const response = await fetch("/api/set-mode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: newMode }),
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok || !data?.success) {
          throw new Error(data?.error || "Failed to set mode")
        }
        const backend = data.backend
        if (backend?.base_mode) setBaseMode(backend.base_mode)
        if (typeof backend?.data_mode === "number") setDataEnabled(backend.data_mode > 0)
      } catch (error) {
        console.error("Mode update failed:", error)
      }
    },
    [setBaseMode, setDataEnabled],
  )

  const handleToggleData = useCallback(async () => {
    try {
      const response = await fetch("/api/set-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "Data" }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Failed to toggle data mode")
      }
      const backend = data.backend
      if (typeof backend?.data_mode === "number") setDataEnabled(backend.data_mode > 0)
      if (backend?.base_mode) setBaseMode(backend.base_mode)
      else if (backend?.mode_name) setBaseMode(String(backend.mode_name).split("-")[0])
    } catch (error) {
      console.error("Data mode toggle failed:", error)
    }
  }, [])

  const handleBandChange = useCallback(
    async (newBand: string) => {
      setBand(newBand)
      const mappedFreq = BAND_TO_FREQ_MHZ[newBand]
      if (mappedFreq) {
        setFrequency(mappedFreq)
      }

      try {
        const response = await fetch("/api/set-band", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ band: newBand }),
        })
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data?.error || "Failed to set band")
        }
      } catch (error) {
        console.error("Band update failed:", error)
      }
    },
    [],
  )

  const handleRotateAntenna = useCallback(async (direction: "cw" | "ccw") => {
    setAntennaDirection((prev) => {
      const change = direction === "cw" ? ROTATION_STEP_DEG : -ROTATION_STEP_DEG
      const newDir = (prev + change + 360) % 360
      return newDir === 360 ? 0 : newDir
    })

    try {
      const endpoint = direction === "cw" ? "/api/rotate-cw" : "/api/rotate-ccw"
      const response = await fetch(endpoint, { method: "POST" })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || "Failed to rotate antenna")
      }
    } catch (error) {
      console.error("Antenna rotation failed:", error)
    }
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
            <ModeSelector
              baseMode={baseMode}
              dataEnabled={dataEnabled}
              onModeChange={handleModeChange}
              onToggleData={handleToggleData}
            />
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
