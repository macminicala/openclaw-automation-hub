import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Zap, FileText, Mail, Calendar, Server } from "lucide-react"

export interface TriggerConfig {
  type: string
  config: Record<string, string>
}

interface TriggerStepProps {
  selectedTrigger: string
  triggerConfig: Record<string, string>
  onSelect: (trigger: string) => void
  onConfigChange: (key: string, value: string) => void
}

const triggers = [
  {
    id: "schedule",
    label: "Schedule",
    description: "Esegui a intervalli regolari",
    icon: Clock,
  },
  {
    id: "webhook",
    label: "HTTP Request",
    description: "Ricevi richieste HTTP",
    icon: Zap,
  },
  {
    id: "file_change",
    label: "Monitora File",
    description: "Rileva modifiche ai file",
    icon: FileText,
  },
  {
    id: "email",
    label: "Email",
    description: "Rispondi a nuove email",
    icon: Mail,
  },
  {
    id: "calendar",
    label: "Calendario",
    description: "Eventi del calendario",
    icon: Calendar,
  },
  {
    id: "system",
    label: "Sistema",
    description: "Eventi di sistema",
    icon: Server,
  },
]

// Preset schedule common patterns
const SCHEDULE_PRESETS = [
  { label: "Ogni minuto", cron: "* * * * *" },
  { label: "Ogni 5 minuti", cron: "*/5 * * * *" },
  { label: "Ogni 15 minuti", cron: "*/15 * * * *" },
  { label: "Ogni 30 minuti", cron: "*/30 * * * *" },
  { label: "Ogni ora", cron: "0 * * * *" },
  { label: "Ogni giorno alle 8:00", cron: "0 8 * * *" },
  { label: "Ogni settimana Lunedì 8:00", cron: "0 8 * * 1" },
  { label: "Ogni mese il 1° alle 8:00", cron: "0 8 1 * *" },
]

export function TriggerStep({ selectedTrigger, triggerConfig, onSelect, onConfigChange }: TriggerStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Scegli un Trigger</h2>
        <p className="text-muted-foreground mt-1">
          Cosa deve avviare questa automazione?
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {triggers.map((trigger) => {
          const Icon = trigger.icon
          const isSelected = selectedTrigger === trigger.id
          return (
            <Card
              key={trigger.id}
              className={`cursor-pointer transition-all hover:border-primary ${
                isSelected ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => onSelect(trigger.id)}
            >
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div
                  className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
                    isSelected ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 ${
                      isSelected ? "text-primary-foreground" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <h3 className="font-medium">{trigger.label}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {trigger.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedTrigger && (
        <Card>
          <CardHeader>
            <CardTitle>Configurazione {triggers.find(t => t.id === selectedTrigger)?.label}</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {/* Schedule Configuration */}
            {selectedTrigger === "schedule" && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="preset">Preset Orari</Label>
                  <Select
                    value={triggerConfig.preset || ""}
                    onValueChange={(value) => {
                      const preset = SCHEDULE_PRESETS.find(p => p.label === value)
                      if (preset) {
                        onConfigChange("cron", preset.cron)
                        onConfigChange("preset", preset.label)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un preset..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHEDULE_PRESETS.map((preset) => (
                        <SelectItem key={preset.label} value={preset.label}>
                          {preset.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Personalizzato...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cron">Espressione Cron</Label>
                  <Input
                    id="cron"
                    placeholder="* * * * *"
                    value={triggerConfig.cron || ""}
                    onChange={(e) => {
                      onConfigChange("cron", e.target.value)
                      onConfigChange("preset", "custom")
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Formato: minuto ora giorno-del-mese mese giorno-della-settimana
                  </p>
                </div>
              </div>
            )}

            {/* Webhook Configuration */}
            {selectedTrigger === "webhook" && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="endpoint">Endpoint URL</Label>
                  <Input
                    id="endpoint"
                    placeholder="/webhook/my-trigger"
                    value={triggerConfig.endpoint || ""}
                    onChange={(e) => onConfigChange("endpoint", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    L'URL completo sarà: http://localhost:18799{triggerConfig.endpoint}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="port">Porta (opzionale)</Label>
                  <Input
                    id="port"
                    placeholder="18800"
                    value={triggerConfig.port || ""}
                    onChange={(e) => onConfigChange("port", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="method">Metodo HTTP</Label>
                  <Select
                    value={triggerConfig.method || "POST"}
                    onValueChange={(value) => onConfigChange("method", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* File Change Configuration */}
            {selectedTrigger === "file_change" && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="path">Percorso File/Cartella</Label>
                  <Input
                    id="path"
                    placeholder="/Users/marco/Documents"
                    value={triggerConfig.path || ""}
                    onChange={(e) => onConfigChange("path", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="event">Evento</Label>
                  <Select
                    value={triggerConfig.event || "modified"}
                    onValueChange={(value) => onConfigChange("event", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created">Creato</SelectItem>
                      <SelectItem value="modified">Modificato</SelectItem>
                      <SelectItem value="deleted">Eliminato</SelectItem>
                      <SelectItem value="any">Qualsiasi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Email Configuration */}
            {selectedTrigger === "email" && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="host">Server IMAP</Label>
                  <Input
                    id="host"
                    placeholder="imap.gmail.com"
                    value={triggerConfig.host || ""}
                    onChange={(e) => onConfigChange("host", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="username">Email</Label>
                  <Input
                    id="username"
                    placeholder="tua@email.com"
                    value={triggerConfig.username || ""}
                    onChange={(e) => onConfigChange("username", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="folder">Cartella</Label>
                  <Input
                    id="folder"
                    placeholder="INBOX"
                    value={triggerConfig.folder || ""}
                    onChange={(e) => onConfigChange("folder", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Calendar Configuration */}
            {selectedTrigger === "calendar" && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="calendar">Calendario</Label>
                  <Select
                    value={triggerConfig.calendar || "default"}
                    onValueChange={(value) => onConfigChange("calendar", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Predefinito</SelectItem>
                      <SelectItem value="work">Lavoro</SelectItem>
                      <SelectItem value="personal">Personale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="event_type">Tipo Evento</Label>
                  <Select
                    value={triggerConfig.event_type || "start"}
                    onValueChange={(value) => onConfigChange("event_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="start">Inizio evento</SelectItem>
                      <SelectItem value="end">Fine evento</SelectItem>
                      <SelectItem value="any">Qualsiasi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* System Configuration */}
            {selectedTrigger === "system" && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="event">Evento Sistema</Label>
                  <Select
                    value={triggerConfig.event || "login"}
                    onValueChange={(value) => onConfigChange("event", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="login">Accesso utente</SelectItem>
                      <SelectItem value="logout">Disconnessione</SelectItem>
                      <SelectItem value="shutdown">Spegnimento</SelectItem>
                      <SelectItem value="battery">Batteria bassa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
