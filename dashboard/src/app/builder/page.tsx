"use client"

import { Suspense, useCallback, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  ReactFlow, 
  addEdge, 
  Background, 
  Controls, 
  Connection, 
  Edge, 
  Node, 
  ReactFlowProvider,
  useReactFlow,
  Panel,
  MarkerType
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Settings, GripVertical } from "lucide-react"
import { toast } from "sonner"

const API_URL = "http://localhost:18799/api"

const triggerLabels: Record<string, string> = {
  schedule: "Schedule",
  webhook: "Webhook",
  file_change: "File Change",
  email: "Email",
  calendar: "Calendar",
  system: "System",
}

const actionLabels: Record<string, string> = {
  shell: "Shell",
  ai_agent: "AI Agent",
  git: "Git",
  notify: "Notify",
  email: "Email",
}

// Preset options
const SCHEDULE_PRESETS = [
  { label: "Ogni minuto", cron: "* * * * *" },
  { label: "Ogni 5 minuti", cron: "*/5 * * * *" },
  { label: "Ogni 15 minuti", cron: "*/15 * * * *" },
  { label: "Ogni ora", cron: "0 * * * *" },
  { label: "Ogni giorno alle 8:00", cron: "0 8 * * *" },
  { label: "Ogni settimana Lunedì 8:00", cron: "0 8 * * 1" },
]

const SHELL_PRESETS = [
  { label: "📁 Backup cartella", command: "cp -r ~/Documents ~/Documents_backup_$(date +%Y%m%d)" },
  { label: "🔄 Pull Git", command: "cd ~/Projects && git pull origin main" },
  { label: "📦 npm install", command: "cd ~/Projects && npm install" },
  { label: "🏗️ npm build", command: "cd ~/Projects && npm run build" },
  { label: "🐳 Docker compose up", command: "cd ~/Projects && docker compose up -d" },
  { label: "💾 Free memory", command: "sudo purge" },
]

function BuilderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { screenToFlowPosition, getNode } = useReactFlow()
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [automationName, setAutomationName] = useState("")
  const [automationId, setAutomationId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [tempConfig, setTempConfig] = useState<Record<string, string>>({})

  useEffect(() => {
    const id = searchParams.get("id")
    if (id) {
      setAutomationId(id)
      loadAutomation(id)
    }
  }, [searchParams])

  const loadAutomation = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/automations/${id}`)
      if (response.ok) {
        const data = await response.json()
        setAutomationName(data.name || "")
        
        const triggerNode: Node = {
          id: "trigger",
          type: "trigger",
          position: { x: 50, y: 200 },
          data: { 
            type: data.trigger?.type || "schedule",
            label: triggerLabels[data.trigger?.type] || "Trigger",
            ...data.trigger
          },
        }
        
        const actionNode: Node = {
          id: "action",
          type: "action",
          position: { x: 500, y: 200 },
          data: { 
            type: data.actions?.[0]?.type || "shell",
            label: actionLabels[data.actions?.[0]?.type] || "Action",
            ...data.actions?.[0]
          },
        }
        
        setNodes([triggerNode, actionNode])
        
        // Create edge
        setEdges([{
          id: "e1",
          source: "trigger",
          target: "action",
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: "#3b82f6", strokeWidth: 2 },
        }])
      }
    } catch (error) {
      console.error("Error loading automation:", error)
      toast.error("Errore nel caricamento dell'automazione")
    }
  }

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const itemType = event.dataTransfer.getData("itemType")

      if (!itemType) return

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newNode: Node = {
        id: `${itemType}-${Date.now()}`,
        type: itemType,
        position,
        data: { 
          type: itemType === "trigger" ? "schedule" : "shell",
          label: itemType === "trigger" ? "Trigger" : "Action"
        },
      }

      setNodes((nds) => [...nds, newNode])
    },
    [screenToFlowPosition],
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    setTempConfig({})
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const handleTypeChange = (type: string) => {
    if (!selectedNode) return
    
    const labels = selectedNode.type === "trigger" ? triggerLabels : actionLabels
    const config: Record<string, string> = { type }
    
    // Set defaults based on type
    if (type === "schedule") config.cron = "0 8 * * *"
    if (type === "webhook") config.endpoint = "/webhook"
    if (type === "file_change") config.path = "~/Documents"
    if (type === "shell") config.command = "echo 'Hello'"
    
    setSelectedNode({
      ...selectedNode,
      data: { ...selectedNode.data, type, label: labels[type] || type, ...config }
    })
    setTempConfig(config)
  }

  const handleConfigChange = (key: string, value: string) => {
    if (!selectedNode) return
    setTempConfig(prev => ({ ...prev, [key]: value }))
  }

  const applyConfig = () => {
    if (!selectedNode) return
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNode.id
          ? { ...n, data: { ...n.data, ...tempConfig } }
          : n
      )
    )
    setSelectedNode({
      ...selectedNode,
      data: { ...selectedNode.data, ...tempConfig }
    })
    toast.success("Configurazione applicata")
  }

  const onSave = async () => {
    if (!automationName.trim()) {
      toast.error("Inserisci un nome per l'automazione")
      return
    }

    const triggerNode = nodes.find((n) => n.type === "trigger")
    const actionNode = nodes.find((n) => n.type === "action")

    if (!triggerNode) {
      toast.error("Aggiungi un Trigger")
      return
    }

    if (!actionNode) {
      toast.error("Aggiungi un'Azione")
      return
    }

    if (edges.length === 0) {
      toast.error("Connetti il Trigger all'Azione")
      return
    }

    setIsSaving(true)
    try {
      const triggerConfig: Record<string, string> = {}
      const actionConfig: Record<string, string> = {}

      Object.entries(triggerNode.data).forEach(([key, value]) => {
        if (!["type", "label", "selected"].includes(key)) {
          triggerConfig[key] = value as string
        }
      })

      Object.entries(actionNode.data).forEach(([key, value]) => {
        if (!["type", "label", "selected"].includes(key)) {
          actionConfig[key] = value as string
        }
      })

      const body = {
        name: automationName,
        trigger: { type: triggerNode.data.type, ...triggerConfig },
        action: { type: actionNode.data.type, ...actionConfig },
        enabled: true,
      }

      const url = automationId
        ? `${API_URL}/automations/${automationId}`
        : `${API_URL}/automations`
      const method = automationId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        toast.success(
          automationId ? "Automazione aggiornata" : "Automazione creata con successo"
        )
        router.push("/")
      } else {
        toast.error("Errore nel salvataggio")
      }
    } catch (error) {
      toast.error("Errore nel salvataggio")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] flex">
      {/* Main Canvas */}
      <div className="flex-1 h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
          fitView
          className="bg-background"
        >
          <Background />
          <Controls />
          <Panel position="top-right">
            <Button variant="outline" onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
          </Panel>
          <Panel position="top-left">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Automazione</Label>
              <Input
                id="name"
                placeholder="Es. Backup Giornaliero"
                value={automationName}
                onChange={(e) => setAutomationName(e.target.value)}
                className="w-64"
              />
            </div>
          </Panel>
          <Panel position="bottom-center">
            <Button 
              onClick={onSave} 
              disabled={isSaving}
              size="lg"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Salvataggio..." : "Salva Automazione"}
            </Button>
          </Panel>
        </ReactFlow>
      </div>

      {/* Sidebar for dragging nodes */}
      <div className="w-64 border-l bg-card p-4 overflow-y-auto">
        <h3 className="font-semibold mb-4">Nodi</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Triggers</h4>
            <div className="space-y-2">
              {Object.entries(triggerLabels).map(([type, label]) => (
                <div
                  key={type}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("itemType", "trigger")
                  }}
                  className="flex items-center gap-2 p-3 bg-muted rounded-lg cursor-grab hover:bg-muted/80 transition-colors"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Actions</h4>
            <div className="space-y-2">
              {Object.entries(actionLabels).map(([type, label]) => (
                <div
                  key={type}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("itemType", "action")
                  }}
                  className="flex items-center gap-2 p-3 bg-muted rounded-lg cursor-grab hover:bg-muted/80 transition-colors"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
          <p className="font-medium mb-2">Come usare:</p>
          <ol className="space-y-1 list-decimal list-inside">
            <li>Trascina un Trigger</li>
            <li>Trascina un'Azione</li>
            <li>Connettili (clicca e trascina)</li>
            <li>Configura i nodi</li>
            <li>Salva</li>
          </ol>
        </div>
      </div>

      {/* Configuration Panel */}
      {selectedNode && (
        <div className="w-80 border-l bg-card p-4 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5" />
            <h3 className="font-semibold">
              {selectedNode.type === "trigger" ? "Configura Trigger" : "Configura Azione"}
            </h3>
          </div>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select
                value={tempConfig.type || (selectedNode.data.type as string)}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(selectedNode.type === "trigger" ? triggerLabels : actionLabels).map(([type, label]) => (
                    <SelectItem key={type} value={type}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Schedule Config */}
            {tempConfig.type === "schedule" && (
              <>
                <div className="grid gap-2">
                  <Label>Preset Orario</Label>
                  <Select
                    value={SCHEDULE_PRESETS.find(p => p.cron === tempConfig.cron)?.label || ""}
                    onValueChange={(value) => {
                      const preset = SCHEDULE_PRESETS.find(p => p.label === value)
                      if (preset) {
                        handleConfigChange("cron", preset.cron)
                        setTempConfig(prev => ({ ...prev, cron: preset.cron }))
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHEDULE_PRESETS.map((preset) => (
                        <SelectItem key={preset.label} value={preset.label}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Cron Expression</Label>
                  <Input
                    value={tempConfig.cron || ((((selectedNode.data.cron || "* * * * *") as string)) as string)}
                    onChange={(e) => handleConfigChange("cron", e.target.value)}
                    placeholder="* * * * *"
                  />
                </div>
              </>
            )}

            {/* Webhook Config */}
            {tempConfig.type === "webhook" && (
              <div className="grid gap-2">
                <Label>Endpoint</Label>
                <Input
                  value={tempConfig.endpoint || ((selectedNode.data.endpoint || "") as string)}
                  onChange={(e) => handleConfigChange("endpoint", e.target.value)}
                  placeholder="/webhook/my-trigger"
                />
              </div>
            )}

            {/* File Change Config */}
            {tempConfig.type === "file_change" && (
              <div className="grid gap-2">
                <Label>Percorso</Label>
                <Input
                  value={tempConfig.path || ((selectedNode.data.path || "") as string)}
                  onChange={(e) => handleConfigChange("path", e.target.value)}
                  placeholder="~/Documents"
                />
              </div>
            )}

            {/* Shell Config */}
            {tempConfig.type === "shell" && (
              <>
                <div className="grid gap-2">
                  <Label>Preset Comando</Label>
                  <Select
                    value={SHELL_PRESETS.find(p => p.command === tempConfig.command)?.label || ""}
                    onValueChange={(value) => {
                      const preset = SHELL_PRESETS.find(p => p.label === value)
                      if (preset) {
                        handleConfigChange("command", preset.command)
                        setTempConfig(prev => ({ ...prev, command: preset.command }))
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SHELL_PRESETS.map((preset) => (
                        <SelectItem key={preset.label} value={preset.label}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Comando</Label>
                  <Input
                    value={tempConfig.command || ((selectedNode.data.command || "") as string)}
                    onChange={(e) => handleConfigChange("command", e.target.value)}
                    placeholder="echo 'Hello'"
                  />
                </div>
              </>
            )}

            <Button onClick={applyConfig} className="w-full">
              Applica
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center">
      <p>Caricamento...</p>
    </div>
  )
}

export default function BuilderPage() {
  return (
    <ReactFlowProvider>
      <Suspense fallback={<LoadingFallback />}>
        <BuilderContent />
      </Suspense>
    </ReactFlowProvider>
  )
}
