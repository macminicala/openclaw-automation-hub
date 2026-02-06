"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Globe } from "lucide-react"

interface WebhookConfigProps {
    config: Record<string, string>
    onConfigChange: (key: string, value: string) => void
    onSave: () => void
}

export function WebhookConfig({ config, onConfigChange, onSave }: WebhookConfigProps) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4" /> Webhook
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label>Endpoint</Label>
                    <Input
                        value={config.endpoint || ""}
                        onChange={(e) => onConfigChange("endpoint", e.target.value)}
                        placeholder="/webhook/my-trigger"
                    />
                </div>

                <p className="text-xs text-muted-foreground">
                    Endpoint: /api/webhook{config.endpoint || "/..."}
                </p>

                <Button onClick={onSave} className="w-full">Salva</Button>
            </CardContent>
        </Card>
    )
}
