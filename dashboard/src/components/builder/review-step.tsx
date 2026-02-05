import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Clock, Zap, Play, RotateCcw } from "lucide-react"

interface ReviewStepProps {
  name: string
  trigger: string
  triggerLabel: string
  action: string
  actionLabel: string
  triggerConfig: Record<string, string>
  actionConfig: Record<string, string>
  triggerLabels?: Record<string, string>
  actionLabels?: Record<string, string>
  onNameChange: (name: string) => void
  onSave: () => void
  onBack: () => void
  isLoading?: boolean
}

const triggerLabels: Record<string, string> = {
  schedule: "Schedule",
  webhook: "HTTP Request",
  file_change: "Monitora File",
  email: "Email",
  calendar: "Calendario",
  system: "Sistema",
}

const actionLabels: Record<string, string> = {
  shell: "Esegui Comando Terminale",
  ai_agent: "Assistente AI",
  git: "Git (auto-commit)",
  notify: "Notifica",
  email: "Email",
}

export function ReviewStep({
  name,
  trigger,
  triggerLabel,
  action,
  actionLabel,
  triggerConfig,
  actionConfig,
  onNameChange,
  onSave,
  onBack,
  isLoading,
}: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Riepilogo e Salva</h2>
        <p className="text-muted-foreground mt-1">
          Controlla la configurazione e salva l'automazione
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Nome dell'automazione"
              className="max-w-md font-normal"
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Trigger</p>
                <p className="text-sm text-muted-foreground">{triggerLabel}</p>
                <Badge variant="secondary" className="mt-1">
                  {triggerLabels[trigger] || trigger}
                </Badge>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Play className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Azione</p>
                <p className="text-sm text-muted-foreground">{actionLabel}</p>
                <Badge variant="secondary" className="mt-1">
                  {actionLabels[action] || action}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-3">Configurazione Trigger</h4>
            <div className="bg-muted rounded-lg p-4 space-y-2">
              {Object.entries(triggerConfig).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{key}:</span>
                  <span className="font-mono">{value}</span>
                </div>
              ))}
              {Object.keys(triggerConfig).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nessuna configurazione aggiuntiva
                </p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Configurazione Azione</h4>
            <div className="bg-muted rounded-lg p-4 space-y-2">
              {Object.entries(actionConfig).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{key}:</span>
                  <span className="font-mono">{value}</span>
                </div>
              ))}
              {Object.keys(actionConfig).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nessuna configurazione aggiuntiva
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Indietro
        </Button>
        <Button onClick={onSave} disabled={!name || isLoading}>
          {isLoading ? (
            <>
              <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
              Salvataggio...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Salva Automazione
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
