"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings } from "lucide-react"
import { SHELL_PRESETS } from "@/lib/constants/automation-config"

interface ShellConfigProps {
    config: Record<string, string>
    onConfigChange: (key: string, value: string) => void
    onSave: () => void
}

export function ShellConfig({ config, onConfigChange, onSave }: ShellConfigProps) {
    const selectedPreset = SHELL_PRESETS.find(p => p.command === config.command)?.label || ""

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                    <Settings className="h-4 w-4" /> Shell
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label>Preset</Label>
                    <Select
                        value={selectedPreset}
                        onValueChange={(value) => {
                            const preset = SHELL_PRESETS.find(p => p.label === value)
                            if (preset) onConfigChange("command", preset.command)
                        }}
                    >
                        <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                        <SelectContent>
                            {SHELL_PRESETS.map((preset) => (
                                <SelectItem key={preset.label} value={preset.label}>{preset.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <Label>Comando <span className="text-red-500">*</span></Label>
                    <Input
                        value={config.command || ""}
                        onChange={(e) => onConfigChange("command", e.target.value)}
                        placeholder="echo 'Hello'"
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Working Directory</Label>
                    <Input
                        value={config.working_dir || ""}
                        onChange={(e) => onConfigChange("working_dir", e.target.value)}
                        placeholder="~/Projects"
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Timeout (secondi)</Label>
                    <Input
                        type="number"
                        value={config.timeout || "60"}
                        onChange={(e) => onConfigChange("timeout", e.target.value)}
                        placeholder="60"
                    />
                </div>

                <Button onClick={onSave} className="w-full" disabled={!config.command?.trim()}>Salva</Button>
            </CardContent>
        </Card>
    )
}
