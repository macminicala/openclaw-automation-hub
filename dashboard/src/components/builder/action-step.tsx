import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Terminal, Bot, GitBranch, Bell, Mail } from "lucide-react"

export interface ActionConfig {
  type: string
  config: Record<string, string>
}

interface ActionStepProps {
  selectedAction: string
  actionConfig: Record<string, string>
  onSelect: (action: string) => void
  onConfigChange: (key: string, value: string) => void
}

// Preset comandi predefiniti per l'utente medio
const SHELL_PRESETS = [
  { label: "📁 Backup cartella", command: "cp -r ~/Documents ~/Documents_backup_$(date +%Y%m%d)" },
  { label: "🔄 Pull Git", command: "cd ~/Projects && git pull origin main" },
  { label: "📦 npm install", command: "cd ~/Projects && npm install" },
  { label: "🏗️ npm build", command: "cd ~/Projects && npm run build" },
  { label: "🧹 Clear cache npm", command: "npm cache clean --force" },
  { label: "🐳 Docker compose up", command: "cd ~/Projects && docker compose up -d" },
  { label: "🐳 Docker compose down", command: "cd ~/Projects && docker compose down" },
  { label: "💾 Free memory", command: "sudo purge" },
  { label: "📊 Disk usage", command: "df -h" },
  { label: "🌐 Check URL", command: "curl -I https://tuosito.com" },
  { label: "📧 Send email report", command: "echo 'Report' | mail -s 'Subject' email@esempio.com" },
  { label: "🔔 Desktop notification", command: "osascript -e 'display notification \"Automazione completata\"'" },
  { label: "📅 Oggi data", command: "echo 'Oggi è $(date +%A\\ %d\\ %B\\ %Y)'" },
  { label: "☁️ Sync cloud", command: "rclone sync ~/Documents cloud:Documents" },
  { label: "🕐 Sync time", command: "sudo ntpdate -s time.apple.com" },
]

const actions = [
  {
    id: "shell",
    label: "Esegui Comando",
    description: "Comandi shell e terminale",
    icon: Terminal,
  },
  {
    id: "ai_agent",
    label: "Assistente AI",
    description: "Usa un agente AI",
    icon: Bot,
  },
  {
    id: "git",
    label: "Git",
    description: "Commit e push automatici",
    icon: GitBranch,
  },
  {
    id: "notify",
    label: "Notifica",
    description: "Invia notifiche",
    icon: Bell,
  },
  {
    id: "email",
    label: "Email",
    description: "Invia email",
    icon: Mail,
  },
]

export function ActionStep({
  selectedAction,
  actionConfig,
  onSelect,
  onConfigChange,
}: ActionStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Scegli un'Azione</h2>
        <p className="text-muted-foreground mt-1">
          Cosa deve fare questa automazione?
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {actions.map((action) => {
          const Icon = action.icon
          const isSelected = selectedAction === action.id
          return (
            <Card
              key={action.id}
              className={`cursor-pointer transition-all hover:border-primary ${
                isSelected ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => onSelect(action.id)}
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
                <h3 className="font-medium">{action.label}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {action.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedAction && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">Configurazione</h3>
            {selectedAction === "shell" && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="preset">Preset Comandi</Label>
                  <Select
                    value={actionConfig.preset || ""}
                    onValueChange={(value) => {
                      const preset = SHELL_PRESETS.find(p => p.label === value)
                      if (preset) {
                        onConfigChange("command", preset.command)
                        onConfigChange("preset", preset.label)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un preset..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SHELL_PRESETS.map((preset) => (
                        <SelectItem key={preset.label} value={preset.label}>
                          {preset.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Comando personalizzato...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="command">Comando</Label>
                  <Input
                    id="command"
                    placeholder="echo 'Hello World'"
                    value={actionConfig.command || ""}
                    onChange={(e) => {
                      onConfigChange("command", e.target.value)
                      onConfigChange("preset", "custom")
                    }}
                  />
                </div>
              </div>
            )}
            {selectedAction === "ai_agent" && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="agent">Agente</Label>
                  <Select
                    value={actionConfig.agent || ""}
                    onValueChange={(value) => onConfigChange("agent", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un agente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="writer">Writer - Scrive contenuti</SelectItem>
                      <SelectItem value="coder">Coder - Scrive codice</SelectItem>
                      <SelectItem value="researcher">Researcher - Ricerca informazioni</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="prompt">Cosa deve fare l'agente?</Label>
                  <Input
                    id="prompt"
                    placeholder="Descrivi il task..."
                    value={actionConfig.prompt || ""}
                    onChange={(e) => onConfigChange("prompt", e.target.value)}
                  />
                </div>
              </div>
            )}
            {selectedAction === "git" && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="repo">Percorso repository</Label>
                  <Input
                    id="repo"
                    placeholder="~/Projects/mio-repo"
                    value={actionConfig.repo || ""}
                    onChange={(e) => onConfigChange("repo", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="message">Messaggio commit</Label>
                  <Input
                    id="message"
                    placeholder="Aggiornamento automatico"
                    value={actionConfig.message || ""}
                    onChange={(e) => onConfigChange("message", e.target.value)}
                  />
                </div>
              </div>
            )}
            {selectedAction === "notify" && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="channel">Canale notifica</Label>
                  <Select
                    value={actionConfig.channel || ""}
                    onValueChange={(value) => onConfigChange("channel", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona canale" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="telegram">Telegram</SelectItem>
                      <SelectItem value="discord">Discord</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="message">Messaggio</Label>
                  <Input
                    id="message"
                    placeholder="Il tuo messaggio..."
                    value={actionConfig.message || ""}
                    onChange={(e) => onConfigChange("message", e.target.value)}
                  />
                </div>
              </div>
            )}
            {selectedAction === "email" && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="to">Destinatario</Label>
                  <Input
                    id="to"
                    type="email"
                    placeholder="email@esempio.com"
                    value={actionConfig.to || ""}
                    onChange={(e) => onConfigChange("to", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subject">Oggetto</Label>
                  <Input
                    id="subject"
                    placeholder="Oggetto dell'email"
                    value={actionConfig.subject || ""}
                    onChange={(e) => onConfigChange("subject", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="body">Messaggio</Label>
                  <Input
                    id="body"
                    placeholder="Contenuto dell'email..."
                    value={actionConfig.body || ""}
                    onChange={(e) => onConfigChange("body", e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
