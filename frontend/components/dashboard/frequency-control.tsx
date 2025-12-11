"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

  const [inputValue, setInputValue] = useState(frequency.toFixed(3))
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    setInputValue(frequency.toFixed(3))
  }, [frequency])

  const handleAdjust = (adjustment: number) => {
    const newFreq = Math.max(0.1, frequency + adjustment)
    onFrequencyChange(Number.parseFloat(newFreq.toFixed(3)))
  }

  const commitInput = () => {
    const parsed = Number.parseFloat(inputValue)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setInputValue(frequency.toFixed(3))
      return
    }
    onFrequencyChange(Number.parseFloat(parsed.toFixed(3)))
    setIsEditing(false)
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Radio className="w-5 h-5 text-primary" />
          Frequency Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Frequency Display (toggleable edit) */}
        <div className="bg-secondary rounded-lg p-4 flex items-center justify-center gap-3">
          {isEditing ? (
            <>
              <Input
                type="number"
                step="0.001"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={commitInput}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitInput()
                }}
                autoFocus
                className="font-mono text-4xl md:text-5xl font-bold text-center bg-background border-primary/40 focus:border-primary"
              />
              <Button variant="secondary" onClick={commitInput} className="whitespace-nowrap">
                Save
              </Button>
            </>
          ) : (
            <>
              <div className="font-mono text-4xl md:text-5xl font-bold text-amber-400 tracking-wider">
                {frequency.toFixed(3)}
                <span className="text-lg ml-2 text-muted-foreground font-normal">MHz</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            </>
          )}
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
          Adjust with the buttons or type a value directly. Changes are sent to the remote station.
        </p>
      </CardContent>
    </Card>
  )
}
