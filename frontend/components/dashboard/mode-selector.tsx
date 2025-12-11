"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings2 } from "lucide-react"

interface ModeSelectorProps {
  selectedMode: string
  onModeChange: (mode: string) => void
}

const MODES = ["LSB", "USB", "AM", "CW", "FM", "RTTY", "Data"]

export function ModeSelector({ selectedMode, onModeChange }: ModeSelectorProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-primary" />
          Mode Selection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {MODES.map((mode) => (
            <Button
              key={mode}
              variant={selectedMode === mode ? "default" : "outline"}
              size="sm"
              onClick={() => onModeChange(mode)}
              className={`transition-all ${
                selectedMode === mode
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "hover:border-primary/50"
              }`}
            >
              {mode}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
