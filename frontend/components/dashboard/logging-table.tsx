"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BookOpen, Plus, Trash2 } from "lucide-react"

interface LogEntry {
  id: number
  date_time: string
  frequency: number
  call_sign: string
  report: string
}

interface LoggingTableProps {
  currentFrequency: number // MHz
}

export function LoggingTable({ currentFrequency }: LoggingTableProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [callSign, setCallSign] = useState("")
  const [report, setReport] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const callSignInputRef = useRef<HTMLInputElement>(null)

  // Load logs on mount
  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/logs", { cache: "no-store" })
      const data = await response.json()
      if (data.success && data.logs) {
        // Sort by date_time descending (newest first)
        const sortedLogs = [...data.logs].sort(
          (a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime()
        )
        setLogs(sortedLogs)
      }
    } catch (error) {
      console.error("Failed to load logs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!callSign.trim()) {
      return // Don't submit if call sign is empty
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frequency: currentFrequency,
          call_sign: callSign.trim().toUpperCase(),
          report: report.trim() || "",
        }),
      })

      const data = await response.json()
      if (data.success) {
        // Add new log to the list (at the top)
        const newLog: LogEntry = {
          id: data.log.id,
          date_time: data.log.date_time,
          frequency: data.log.frequency,
          call_sign: data.log.call_sign,
          report: data.log.report,
        }
        setLogs([newLog, ...logs])
        
        // Clear form
        setCallSign("")
        setReport("")
        
        // Focus back on call sign input
        callSignInputRef.current?.focus()
      } else {
        console.error("Failed to save log:", data.error)
        alert(`Failed to save log: ${data.error}`)
      }
    } catch (error) {
      console.error("Error saving log:", error)
      alert("Failed to save log. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this log entry?")) {
      return
    }

    try {
      const response = await fetch(`/api/logs/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()
      if (data.success) {
        // Remove from list
        setLogs(logs.filter((log) => log.id !== id))
      } else {
        console.error("Failed to delete log:", data.error)
        alert(`Failed to delete log: ${data.error}`)
      }
    } catch (error) {
      console.error("Error deleting log:", error)
      alert("Failed to delete log. Please try again.")
    }
  }

  const formatFrequency = (freq: number) => {
    return freq.toFixed(3)
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Contact Log
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Entry Form */}
        <form onSubmit={handleSubmit} className="space-y-3 p-3 bg-secondary/50 rounded-lg">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Frequency (MHz)</label>
              <Input
                value={formatFrequency(currentFrequency)}
                disabled
                className="bg-background text-sm font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Call Sign *</label>
              <Input
                ref={callSignInputRef}
                value={callSign}
                onChange={(e) => setCallSign(e.target.value.toUpperCase())}
                placeholder="ET3AA"
                className="bg-background text-sm uppercase"
                required
                disabled={isSaving}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Report</label>
              <Input
                value={report}
                onChange={(e) => setReport(e.target.value)}
                placeholder="59"
                className="bg-background text-sm"
                disabled={isSaving}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && callSign.trim()) {
                    handleSubmit(e as any)
                  }
                }}
              />
            </div>
          </div>
          <Button
            type="submit"
            size="sm"
            className="w-full"
            disabled={isSaving || !callSign.trim()}
          >
            <Plus className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Add Log Entry"}
          </Button>
        </form>

        {/* Logs Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 sticky top-0">
                <tr>
                  <th className="text-left p-2 font-medium text-muted-foreground">Time</th>
                  <th className="text-left p-2 font-medium text-muted-foreground">Frequency</th>
                  <th className="text-left p-2 font-medium text-muted-foreground">Call Sign</th>
                  <th className="text-left p-2 font-medium text-muted-foreground">Report</th>
                  <th className="text-right p-2 font-medium text-muted-foreground w-12"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      Loading logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      No logs yet. Add your first contact above.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-t hover:bg-secondary/30 transition-colors">
                      <td className="p-2 text-muted-foreground">{formatDateTime(log.date_time)}</td>
                      <td className="p-2 font-mono">{formatFrequency(log.frequency)}</td>
                      <td className="p-2 font-medium">{log.call_sign}</td>
                      <td className="p-2">{log.report || "-"}</td>
                      <td className="p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(log.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {logs.length} contact{logs.length !== 1 ? "s" : ""} logged
        </p>
      </CardContent>
    </Card>
  )
}

