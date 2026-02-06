"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Play, Trash2, MoreHorizontal, Clock, Zap, Folder, Mail, Calendar, Monitor, Pencil, History } from "lucide-react"
import { useMemo } from "react"
import Link from "next/link"

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
  onRun?: (id: string) => void
}

const triggerIcons: Record<string, React.ReactNode> = {
  schedule: <Clock className="h-4 w-4" />,
  webhook: <Zap className="h-4 w-4" />,
  file_change: <Folder className="h-4 w-4" />,
  file: <Folder className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  calendar: <Calendar className="h-4 w-4" />,
  system: <Monitor className="h-4 w-4" />,
}

const triggerGroupLabels: Record<string, string> = {
  schedule: "⏰ Schedulati",
  webhook: "🔗 Webhook",
  file_change: "📁 File Change",
  file: "📁 File",
  email: "📧 Email",
  calendar: "📅 Calendario",
  system: "💻 Sistema",
}

export function AutomationsList({
  automations,
  onToggle,
  onDelete,
  onEdit,
  onCreate,
  onRun,
}: AutomationsListProps) {
  // Group automations by trigger type
  const groupedAutomations = useMemo(() => {
    const groups: Record<string, Automation[]> = {}

    automations.forEach((automation) => {
      const triggerType = automation.trigger || "other"
      if (!groups[triggerType]) {
        groups[triggerType] = []
      }
      groups[triggerType].push(automation)
    })

    // Sort groups by the order we want to display them
    const orderedTriggers = ["schedule", "webhook", "file_change", "file", "email", "calendar", "system"]
    const sortedGroups: [string, Automation[]][] = []

    orderedTriggers.forEach((trigger) => {
      if (groups[trigger]) {
        sortedGroups.push([trigger, groups[trigger]])
      }
    })

    // Add any remaining triggers not in the ordered list
    Object.entries(groups).forEach(([trigger, autos]) => {
      if (!orderedTriggers.includes(trigger)) {
        sortedGroups.push([trigger, autos])
      }
    })

    return sortedGroups
  }, [automations])

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
    <div className="space-y-6">
      {groupedAutomations.map(([triggerType, autos]) => (
        <div key={triggerType}>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            {triggerIcons[triggerType]}
            {triggerGroupLabels[triggerType] || triggerType}
            <Badge variant="secondary" className="ml-2">{autos.length}</Badge>
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {autos.map((automation, index) => (
              <Card key={automation.id || `${triggerType}-${index}`} className="relative group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    {/* Quick Toggle Switch */}
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={automation.enabled}
                        onCheckedChange={(checked) => onToggle(automation.id, checked)}
                        className="data-[state=checked]:bg-green-500"
                      />
                      <span className="text-xs text-muted-foreground">
                        {automation.enabled ? "Attiva" : "Off"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {/* Run Button */}
                      {onRun && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => onRun(automation.id)}
                          title="Esegui ora"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Dropdown Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(automation)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifica
                          </DropdownMenuItem>
                          {onRun && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onRun(automation.id)}>
                                <Play className="mr-2 h-4 w-4" />
                                Esegui ora
                              </DropdownMenuItem>
                            </>
                          )}
                          <Link href={`/logs?automation=${automation.id}`}>
                            <DropdownMenuItem>
                              <History className="mr-2 h-4 w-4" />
                              Vedi logs
                            </DropdownMenuItem>
                          </Link>
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
                  </div>
                  <CardTitle className="text-lg mt-2 cursor-pointer hover:text-primary" onClick={() => onEdit(automation)}>
                    {automation.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Azione:</span>
                    <span className="font-medium">{automation.actionLabel}</span>
                  </div>
                  {automation.lastRun && (
                    <p className="text-xs text-muted-foreground">
                      Ultima esecuzione: {automation.lastRun}
                    </p>
                  )}
                  {automation.nextRun && automation.enabled && (
                    <p className="text-xs text-muted-foreground">
                      Prossima: {automation.nextRun}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
