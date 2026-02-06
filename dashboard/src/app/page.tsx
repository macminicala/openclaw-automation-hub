"use client"

import { useEffect, useState, useMemo } from "react"
import { Toaster } from "@/components/ui/sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Header } from "@/components/header"
import { AutomationsList, type Automation } from "@/components/automations-list"
import { AutomationFilters } from "@/components/automation-filters"
import { StatsCards } from "@/components/stats-cards"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { useRouter } from "next/navigation"

const API_URL = "http://localhost:18799/api"

export default function Dashboard() {
  const router = useRouter()
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [triggerFilter, setTriggerFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    id: string
    name: string
  }>({ open: false, id: "", name: "" })

  const stats = {
    total: automations.length,
    active: automations.filter((a) => a.enabled).length,
    failed: 0,
  }

  // Filter automations
  const filteredAutomations = useMemo(() => {
    return automations.filter((auto) => {
      // Search filter
      if (searchQuery && !auto.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      // Trigger filter
      if (triggerFilter !== "all" && auto.trigger !== triggerFilter) {
        return false
      }
      // Status filter
      if (statusFilter === "active" && !auto.enabled) {
        return false
      }
      if (statusFilter === "inactive" && auto.enabled) {
        return false
      }
      return true
    })
  }, [automations, searchQuery, triggerFilter, statusFilter])

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
      file_change: "Monitora File",
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

  const handleDeleteClick = (id: string) => {
    const automation = automations.find((a) => a.id === id)
    if (automation) {
      setDeleteDialog({ open: true, id, name: automation.name })
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`${API_URL}/automations/${deleteDialog.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setAutomations((prev) => prev.filter((a) => a.id !== deleteDialog.id))
        toast.success("Automazione eliminata")
      }
    } catch (error) {
      toast.error("Errore nell'eliminazione dell'automazione")
    } finally {
      setDeleteDialog({ open: false, id: "", name: "" })
    }
  }

  const handleEdit = (automation: Automation) => {
    router.push(`/builder?id=${automation.id}`)
  }

  const handleRun = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/automations/${id}/run`, {
        method: "POST",
      })
      if (response.ok) {
        toast.success("Automazione avviata!")
      }
    } catch (error) {
      toast.error("Errore nell'esecuzione dell'automazione")
    }
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

        {/* Stats Cards */}
        <StatsCards
          total={stats.total}
          active={stats.active}
          failed={stats.failed}
        />

        {/* Filters */}
        <AutomationFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          triggerFilter={triggerFilter}
          onTriggerFilterChange={setTriggerFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {/* Loading State */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <AutomationsList
            automations={filteredAutomations}
            onToggle={handleToggle}
            onDelete={handleDeleteClick}
            onEdit={handleEdit}
            onCreate={() => router.push("/builder")}
            onRun={handleRun}
          />
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        automationName={deleteDialog.name}
        onConfirm={handleDeleteConfirm}
      />

      <Toaster position="bottom-right" />
    </div>
  )
}
