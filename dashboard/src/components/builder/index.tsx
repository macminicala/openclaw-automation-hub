"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Save, Zap } from "lucide-react"
import { TriggerStep, type TriggerConfig } from "./trigger-step"
import { ActionStep, type ActionConfig } from "./action-step"

interface AutomationBuilderProps {
  automation?: {
    id: string
    name: string
    trigger: string
    action: string
    enabled: boolean
    config: Record<string, string>
  }
  onClose: () => void
  onSave: (data: {
    name: string
    trigger: string
    action: string
    enabled: boolean
    config: Record<string, string>
  }) => void
}

export function AutomationBuilder({ automation, onClose, onSave }: AutomationBuilderProps) {
  const [name, setName] = useState(automation?.name || "")
  const [trigger, setTrigger] = useState(automation?.trigger || "")
  const [action, setAction] = useState(automation?.action || "")
  const [triggerConfig, setTriggerConfig] = useState<Record<string, string>>(
    automation?.config || {}
  )
  const [actionConfig, setActionConfig] = useState<Record<string, string>>(
    automation?.config || {}
  )
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Inserisci un nome per l'automazione")
      return
    }
    if (!trigger) {
      alert("Seleziona un trigger")
      return
    }
    if (!action) {
      alert("Seleziona un'azione")
      return
    }

    setIsLoading(true)
    try {
      onSave({
        name,
        trigger,
        action,
        enabled: automation?.enabled ?? true,
        config: { ...triggerConfig, ...actionConfig },
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {automation ? "Modifica Automazione" : "Nuova Automazione"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Nome */}
          <div className="grid gap-2">
            <Label htmlFor="name">Nome Automazione</Label>
            <Input
              id="name"
              placeholder="Es. Backup Giornaliero"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Trigger */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Trigger</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <TriggerStep
                selectedTrigger={trigger}
                triggerConfig={triggerConfig}
                onSelect={setTrigger}
                onConfigChange={(key, value) => setTriggerConfig(prev => ({ ...prev, [key]: value }))}
              />
            </CardContent>
          </Card>

          {/* Azione */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Azione</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ActionStep
                selectedAction={action}
                actionConfig={actionConfig}
                onSelect={setAction}
                onConfigChange={(key, value) =>
                  setActionConfig((prev) => ({ ...prev, [key]: value }))
                }
              />
            </CardContent>
          </Card>

          {/* Pulsanti */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Salvataggio..." : "Salva Automazione"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
