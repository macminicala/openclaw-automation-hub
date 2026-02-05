"use client"

import { useEffect, useState } from "react"
import { Toaster } from "@/components/ui/sonner"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Header } from "@/components/header"
import { AutomationsList, type Automation } from "@/components/automations-list"
import { AutomationBuilder } from "@/components/builder"

const API_URL = "http://localhost:18799/api"

export default function Dashboard() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingAutomation, setEditingAutomation] = useState<Automation | undefined>()
  const [activeTab, setActiveTab] = useState("automations")

  const stats = {
    total: automations.length,
    active: automations.filter((a) => a.enabled).length,
    failed: 0,
  }

  useEffect(() => {
    fetchAutomations()
  }, [])

  const fetchAutomations = async () => {
    try {
      const response = await fetch(`${API_URL}/automations`)
      if (response.ok) {
        const data = await response.json()
        // API returns { automations: {...}, stats: {...} } - convert to array
        const automationsList = data.automations ? Object.values(data.automations) : []
        // Mappa i dati dell'API al formato del frontend
        const mapped: Automation[] = automationsList.map((auto: any) => ({
          id: auto.id,
          name: auto.name,
          trigger: auto.trigger.type,
          triggerLabel: getTriggerLabel(auto.trigger.type),
          action: auto.actions?.[0]?.type || 'unknown',
          actionLabel: getActionLabel(auto.actions?.[0]?.type || 'unknown'),
          enabled: auto.enabled,
          lastRun: auto.lastRun ? new Date(auto.lastRun).toLocaleString() : undefined,
          nextRun: auto.nextRun ? new Date(auto.nextRun).toLocaleString() : undefined,
        }))
        setAutomations(mapped)
      }
    } catch (error) {
      console.error("Error fetching automations:", error)
      toast.error("Errore nel caricamento delle automazioni")
    } finally {
      setLoading(false)
    }
  }

  const getTriggerLabel = (type: string): string => {
    const labels: Record<string, string> = {
      schedule: "Schedule",
      webhook: "HTTP Request",
      file: "Monitora File",
      email: "Email",
      calendar: "Calendario",
      system: "Sistema",
    }
    return labels[type] || type
  }

  const getActionLabel = (type: string): string => {
    const labels: Record<string, string> = {
      shell: "Esegui Comando Terminale",
      ai_agent: "Assistente AI",
      git: "Git (auto-commit)",
      notify: "Notifica",
      email: "Email",
    }
    return labels[type] || type
  }

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`${API_URL}/automations/${id}/toggle`, {
        method: "POST",
      })
      if (response.ok) {
        setAutomations((prev) =>
          prev.map((a) => (a.id === id ? { ...a, enabled } : a))
        )
        toast.success(enabled ? "Automazione attivata" : "Automazione disattivata")
      }
    } catch (error) {
      toast.error("Errore nell'aggiornamento dell'automazione")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/automations/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setAutomations((prev) => prev.filter((a) => a.id !== id))
        toast.success("Automazione eliminata")
      }
    } catch (error) {
      toast.error("Errore nell'eliminazione dell'automazione")
    }
  }

  const handleEdit = (automation: Automation) => {
    setEditingAutomation(automation)
    setShowBuilder(true)
  }

  const handleSave = async (data: {
    name: string
    trigger: string
    action: string
    enabled: boolean
    config: Record<string, string>
  }) => {
    try {
      const body = {
        name: data.name,
        trigger: { type: data.trigger, config: {} },
        action: { type: data.action, config: data.config },
        enabled: data.enabled,
      }

      const url = editingAutomation
        ? `${API_URL}/automations/${editingAutomation.id}`
        : `${API_URL}/automations`
      const method = editingAutomation ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        toast.success(
          editingAutomation
            ? "Automazione aggiornata"
            : "Automazione creata con successo"
        )
        setShowBuilder(false)
        setEditingAutomation(undefined)
        fetchAutomations()
      } else {
        toast.error("Errore nel salvataggio dell'automazione")
      }
    } catch (error) {
      toast.error("Errore nel salvataggio dell'automazione")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header stats={stats} />

      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="automations">Automazioni</TabsTrigger>
              <TabsTrigger
                value="new"
                onClick={() => {
                  setEditingAutomation(undefined)
                  setShowBuilder(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nuova Automazione
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="automations">
            <AutomationsList
              automations={automations}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          </TabsContent>

          <TabsContent value="new">
            <AutomationsList
              automations={automations}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          </TabsContent>
        </Tabs>
      </main>

      {showBuilder && (
        <AutomationBuilder
          automation={
            editingAutomation
              ? {
                  id: editingAutomation.id,
                  name: editingAutomation.name,
                  trigger: editingAutomation.trigger,
                  action: editingAutomation.action,
                  enabled: editingAutomation.enabled,
                  config: {}, // L'API non restituisce config nel listato
                }
              : undefined
          }
          onClose={() => {
            setShowBuilder(false)
            setEditingAutomation(undefined)
          }}
          onSave={handleSave}
        />
      )}

      <Toaster position="bottom-right" />
    </div>
  )
}
