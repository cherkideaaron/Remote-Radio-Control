"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Radio } from "lucide-react"

interface FrequencyControlProps {
  frequency: number
  onFrequencyChange: (freq: number) => void
}

export function FrequencyControl({ frequency, onFrequencyChange }: FrequencyControlProps) {
  const adjustments = [
    { label: "-100", value: -0.1 },
    { label: "-10", value: -0.01 },
    { label: "-1", value: -0.001 },
    { label: "+1", value: 0.001 },
    { label: "+10", value: 0.01 },
    { label: "+100", value: 0.1 },
  ]

  const handleAdjust = (adjustment: number) => {
    const newFreq = Math.max(0.1, frequency + adjustment)
    onFrequencyChange(Number.parseFloat(newFreq.toFixed(3)))
  }

  // Format frequency for display
  const formatFrequency = (freq: number) => {
    const parts = freq.toFixed(3).split(".")
    return {
      mhz: parts[0],
      khz: parts[1] || "000",
    }
  }

  const { mhz, khz } = formatFrequency(frequency)

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Radio className="w-5 h-5 text-primary" />
          Frequency Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Frequency Display */}
        <div className="bg-secondary rounded-lg p-4 text-center">
          <div className="font-mono text-4xl md:text-5xl font-bold text-primary tracking-wider">
            <span>{mhz}</span>
            <span className="text-muted-foreground">.</span>
            <span>{khz}</span>
            <span className="text-lg ml-2 text-muted-foreground font-normal">MHz</span>
          </div>
        </div>

        {/* Adjustment Buttons */}
        <div className="grid grid-cols-6 gap-2">
          {adjustments.map((adj) => (
            <Button
              key={adj.label}
              variant="outline"
              size="sm"
              onClick={() => handleAdjust(adj.value)}
              className={`text-xs font-mono ${
                adj.value < 0
                  ? "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                  : "hover:bg-primary/10 hover:text-primary hover:border-primary/50"
              }`}
            >
              {adj.label}
              <span className="text-[10px] ml-0.5">KHz</span>
            </Button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Click buttons to adjust frequency. Changes will be sent to the remote station.
        </p>
      </CardContent>
    </Card>
  )
}
