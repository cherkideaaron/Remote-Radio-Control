"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Compass, RotateCcw, RotateCw } from "lucide-react"

interface AntennaCompassProps {
  direction: number
  onRotate: (direction: "cw" | "ccw") => void
}

export function AntennaCompass({ direction, onRotate }: AntennaCompassProps) {
  const getDirectionLabel = (deg: number) => {
    if (deg >= 337.5 || deg < 22.5) return "N"
    if (deg >= 22.5 && deg < 67.5) return "NE"
    if (deg >= 67.5 && deg < 112.5) return "E"
    if (deg >= 112.5 && deg < 157.5) return "SE"
    if (deg >= 157.5 && deg < 202.5) return "S"
    if (deg >= 202.5 && deg < 247.5) return "SW"
    if (deg >= 247.5 && deg < 292.5) return "W"
    return "NW"
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Compass className="w-5 h-5 text-primary" />
          Antenna Direction
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        {/* Compass */}
        <div className="relative w-48 h-48">
          {/* Compass ring */}
          <div className="absolute inset-0 rounded-full border-4 border-secondary" />

          {/* Cardinal directions */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full">
              <span className="absolute top-2 left-1/2 -translate-x-1/2 text-sm font-bold text-primary">N</span>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm text-muted-foreground">S</span>
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">W</span>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">E</span>
            </div>
          </div>

          {/* Compass ticks */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            {Array.from({ length: 36 }).map((_, i) => {
              const angle = i * 10
              const isCardinal = angle % 90 === 0
              const isMajor = angle % 30 === 0
              const length = isCardinal ? 8 : isMajor ? 5 : 3
              const x1 = 50 + 42 * Math.sin((angle * Math.PI) / 180)
              const y1 = 50 - 42 * Math.cos((angle * Math.PI) / 180)
              const x2 = 50 + (42 - length) * Math.sin((angle * Math.PI) / 180)
              const y2 = 50 - (42 - length) * Math.cos((angle * Math.PI) / 180)
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isCardinal ? "oklch(0.75 0.15 85)" : "oklch(0.4 0.01 250)"}
                  strokeWidth={isCardinal ? 2 : 1}
                />
              )
            })}
          </svg>

          {/* Antenna needle */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-300"
            style={{ transform: `rotate(${direction}deg)` }}
          >
            <div className="w-1 h-20 bg-primary rounded-full relative">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-primary" />
            </div>
          </div>

          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-secondary border-2 border-primary" />
        </div>

        {/* Direction display */}
        <div className="text-center">
          <div className="text-3xl font-mono font-bold text-primary">{direction}°</div>
          <div className="text-sm text-muted-foreground">{getDirectionLabel(direction)}</div>
        </div>

        {/* Rotation buttons */}
        <div className="flex gap-4 w-full">
          <Button
            variant="outline"
            className="flex-1 hover:border-primary/50 bg-transparent"
            onClick={() => onRotate("ccw")}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            CCW
          </Button>
          <Button
            variant="outline"
            className="flex-1 hover:border-primary/50 bg-transparent"
            onClick={() => onRotate("cw")}
          >
            <RotateCw className="w-4 h-4 mr-2" />
            CW
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Rotate the antenna to point in the desired direction
        </p>
      </CardContent>
    </Card>
  )
}
