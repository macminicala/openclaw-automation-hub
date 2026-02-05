"use client"

import { useEffect, useState } from "react"
import { Toaster } from "@/components/ui/sonner"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Header } from "@/components/header"
import { AutomationsList, type Automation } from "@/components/automations-list"
import { useRouter } from "next/navigation"

const API_URL = "http://localhost:18799/api"

export default function Dashboard() {
  const router = useRouter()
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)

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
        const automationsList = data.automations ? Object.values(data.automations) : []
        const mapped: Automation[] = automationsList.map((auto: any) => ({
          id: auto.id,
          name: auto.name,
          trigger: auto.trigger?.type || auto.trigger || 'unknown',
          triggerLabel: getTriggerLabel(auto.trigger?.type || auto.trigger || 'unknown'),
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
      const response = await fetch(`${API_URL}/automations/${id}/${enabled ? 'enable' : 'disable'}`, {
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
    router.push(`/builder?id=${automation.id}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header stats={stats} />

      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Automazioni</h1>
          <Button onClick={() => router.push("/builder")}>
            <Plus className="mr-2 h-4 w-4" />
            Crea Automazione
          </Button>
        </div>

        <AutomationsList
          automations={automations}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onCreate={() => router.push("/builder")}
        />
      </main>

      <Toaster position="bottom-right" />
    </div>
  )
}
