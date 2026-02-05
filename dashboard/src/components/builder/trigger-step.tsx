import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Zap, FileText, Mail, Calendar, Server } from "lucide-react"

export interface TriggerConfig {
  type: string
  config: Record<string, string>
}

interface TriggerStepProps {
  selectedTrigger: string
  onSelect: (trigger: string) => void
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

export function TriggerStep({ selectedTrigger, onSelect }: TriggerStepProps) {
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
    </div>
  )
}
