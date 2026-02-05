"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Play, Pause, Trash2, MoreHorizontal, Clock, Zap, GitBranch } from "lucide-react"

export interface Automation {
  id: string
  name: string
  trigger: string
  triggerLabel: string
  action: string
  actionLabel: string
  enabled: boolean
  lastRun?: string
  nextRun?: string
}

interface AutomationsListProps {
  automations: Automation[]
  onToggle: (id: string, enabled: boolean) => void
  onDelete: (id: string) => void
  onEdit: (automation: Automation) => void
  onCreate: () => void
}

const triggerIcons: Record<string, React.ReactNode> = {
  schedule: <Clock className="h-4 w-4" />,
  webhook: <Zap className="h-4 w-4" />,
  file: <GitBranch className="h-4 w-4" />,
  email: <Zap className="h-4 w-4" />,
  calendar: <Clock className="h-4 w-4" />,
  system: <Zap className="h-4 w-4" />,
}

export function AutomationsList({
  automations,
  onToggle,
  onDelete,
  onEdit,
  onCreate,
}: AutomationsListProps) {
  if (automations.length === 0) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Zap className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Nessuna automazione</p>
          <p className="text-sm text-muted-foreground mb-4">
            Crea la tua prima automazione per iniziare
          </p>
          <Button onClick={onCreate}>
            <Zap className="h-4 w-4 mr-2" />
            Crea Automazione
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {automations.map((automation) => (
        <Card key={automation.id} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  variant={automation.enabled ? "default" : "secondary"}
                  className={automation.enabled ? "bg-green-500" : ""}
                >
                  {automation.enabled ? "Attiva" : "Disattiva"}
                </Badge>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(automation)}>
                    Modifica
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onToggle(automation.id, !automation.enabled)}
                  >
                    {automation.enabled ? (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Disattiva
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Attiva
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(automation.id)}
                    className="text-red-500 focus:text-red-500"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Elimina
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardTitle className="text-lg mt-2">{automation.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Trigger:</span>
              <div className="flex items-center gap-1">
                {triggerIcons[automation.trigger]}
                <span>{automation.triggerLabel}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Azione:</span>
              <span>{automation.actionLabel}</span>
            </div>
            {automation.lastRun && (
              <p className="text-xs text-muted-foreground">
                Ultima esecuzione: {automation.lastRun}
              </p>
            )}
            {automation.nextRun && !automation.enabled && (
              <p className="text-xs text-muted-foreground">
                Prossima: {automation.nextRun}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
