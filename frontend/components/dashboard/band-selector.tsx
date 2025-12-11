"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Layers } from "lucide-react"

interface BandSelectorProps {
  selectedBand: string
  onBandChange: (band: string) => void
}

const BANDS = ["80m", "40m", "30m", "20m", "17m", "15m", "10m", "6m"]

export function BandSelector({ selectedBand, onBandChange }: BandSelectorProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          Band Selection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-8 gap-2">
          {BANDS.map((band) => (
            <Button
              key={band}
              variant={selectedBand === band ? "default" : "outline"}
              size="sm"
              onClick={() => onBandChange(band)}
              className={`transition-all ${
                selectedBand === band
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "hover:border-primary/50"
              }`}
            >
              {band}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
