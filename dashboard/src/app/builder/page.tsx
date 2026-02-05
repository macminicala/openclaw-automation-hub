"use client"

import { Suspense, useCallback, useState, useEffect, useMemo } from "react"
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
  MarkerType,
  Handle,
  Position,
  NodeChange,
  EdgeChange
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Settings, GripVertical, Clock, Calendar, Repeat, Zap } from "lucide-react"
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

const SHELL_PRESETS = [
  { label: "📁 Backup cartella", command: "cp -r ~/Documents ~/Documents_backup_$(date +%Y%m%d)" },
  { label: "🔄 Pull Git", command: "cd ~/Projects && git pull origin main" },
  { label: "📦 npm install", command: "cd ~/Projects && npm install" },
  { label: "🏗️ npm build", command: "cd ~/Projects && npm run build" },
  { label: "🐳 Docker compose up", command: "cd ~/Projects && docker compose up -d" },
  { label: "💾 Free memory", command: "sudo purge" },
]

const SCHEDULE_FREQUENCIES = [
  { value: "minutely", label: "Ogni minuto" },
  { value: "hourly", label: "Ogni ora" },
  { value: "daily", label: "Ogni giorno" },
  { value: "weekly", label: "Ogni settimana" },
  { value: "monthly", label: "Ogni mese" },
]

const DAYS_OF_WEEK = [
  { value: "1", label: "Lunedì" },
  { value: "2", label: "Martedì" },
  { value: "3", label: "Mercoledì" },
  { value: "4", label: "Giovedì" },
  { value: "5", label: "Venerdì" },
  { value: "6", label: "Sabato" },
  { value: "0", label: "Domenica" },
]

const DAYS_OF_MONTH = Array.from({ length: 28 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}`
}))

function TriggerNode({ data, isConnectable }: any) {
  const colors: Record<string, string> = {
    schedule: "bg-blue-500 border-blue-600",
    webhook: "bg-green-500 border-green-600",
    file_change: "bg-purple-500 border-purple-600",
    email: "bg-yellow-500 border-yellow-600",
    calendar: "bg-pink-500 border-pink-600",
    system: "bg-red-500 border-red-600",
  }
  const colorClass = colors[data.type as string] || "bg-blue-500 border-blue-600"

  return (
    <div className={`${colorClass} rounded-lg p-3 min-w-[140px] shadow-lg text-white cursor-grab active:cursor-grabbing select-none`}>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-white" />
      <div className="flex items-center gap-2 pointer-events-none">
        <Zap className="w-5 h-5" />
        <div>
          <div className="text-sm font-bold">{data.label as string}</div>
          <div className="text-xs opacity-80">{data.sublabel as string || data.type}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-white" />
    </div>
  )
}

function ActionNode({ data, isConnectable }: any) {
  const colors: Record<string, string> = {
    shell: "bg-orange-500 border-orange-600",
    ai_agent: "bg-indigo-500 border-indigo-600",
    git: "bg-gray-600 border-gray-700",
    notify: "bg-teal-500 border-teal-600",
    email: "bg-cyan-500 border-cyan-600",
  }
  const colorClass = colors[data.type as string] || "bg-orange-500 border-orange-600"

  return (
    <div className={`${colorClass} rounded-lg p-3 min-w-[140px] shadow-lg text-white cursor-grab active:cursor-grabbing select-none`}>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-white" />
      <div className="flex items-center gap-2 pointer-events-none">
        <Settings className="w-5 h-5" />
        <div>
          <div className="text-sm font-bold">{data.label as string}</div>
          <div className="text-xs opacity-80">{data.sublabel as string || data.type}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-white" />
    </div>
  )
}

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
}

function BuilderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { screenToFlowPosition } = useReactFlow()
  
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [automationName, setAutomationName] = useState("")
  const [automationId, setAutomationId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [tempConfig, setTempConfig] = useState<Record<string, string>>({})

  const [scheduleFreq, setScheduleFreq] = useState("daily")
  const [scheduleTime, setScheduleTime] = useState("08:00")
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState("1")
  const [scheduleDayOfMonth, setScheduleDayOfMonth] = useState("1")

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
        
        setEdges([{
          id: "e1",
          source: "trigger",
          target: "action",
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: "#3b82f6", strokeWidth: 2 },
        }])
      }
    } catch (error) {
      console.error("Error loading:", error)
      toast.error("Errore nel caricamento")
    }
  }

  const generateCronFromSchedule = () => {
    const [hours, minutes] = scheduleTime.split(":")
    
    switch (scheduleFreq) {
      case "minutely": return "* * * * *"
      case "hourly": return `0 * * * *`
      case "daily": return `${minutes} ${hours} * * *`
      case "weekly": return `${minutes} ${hours} * * ${scheduleDayOfWeek}`
      case "monthly": return `${minutes} ${hours} ${scheduleDayOfMonth} * *`
      default: return `${minutes} ${hours} * * *`
    }
  }

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const itemType = event.dataTransfer.getData("itemType")
      if (!itemType) return

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      
      const labels = itemType === "trigger" ? triggerLabels : actionLabels
      const defaultType = itemType === "trigger" ? "schedule" : "shell"

      const newNode: Node = {
        id: `${itemType}-${Date.now()}`,
        type: itemType,
        position,
        data: { 
          type: defaultType,
          label: labels[defaultType],
        },
      }

      setNodes((nds) => [...nds, newNode])
    },
    [screenToFlowPosition],
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    
    // Initialize tempConfig with existing node data
    const existingConfig: Record<string, string> = { type: node.data.type as string }
    Object.entries(node.data).forEach(([key, value]) => {
      if (!["type", "label", "sublabel"].includes(key) && typeof value === "string") {
        existingConfig[key] = value
      }
    })
    setTempConfig(existingConfig)
    
    // Set schedule values from node data
    if (node.data.type === "schedule" && node.data.cron) {
      const cron = node.data.cron as string
      const parts = cron.split(" ")
      
      if (parts[0] !== "*" && parts[1] === "*") {
        setScheduleFreq("minutely")
      } else if (parts[1] !== "*" && parts[2] === "*") {
        setScheduleFreq("hourly")
      } else if (parts[4] !== "*" && parts[2] === "*") {
        setScheduleFreq("daily")
        setScheduleTime(`${parts[1].padStart(2, "0")}:${parts[0].padStart(2, "0")}`)
      } else if (parts[4] !== "*" && parts[2] !== "*") {
        setScheduleFreq("monthly")
        setScheduleTime(`${parts[1].padStart(2, "0")}:${parts[0].padStart(2, "0")}`)
        setScheduleDayOfMonth(parts[2])
      } else if (parts[4] !== "*") {
        setScheduleFreq("weekly")
        setScheduleTime(`${parts[1].padStart(2, "0")}:${parts[0].padStart(2, "0")}`)
        setScheduleDayOfWeek(parts[4])
      } else {
        setScheduleFreq("daily")
        setScheduleTime(`${parts[1].padStart(2, "0")}:${parts[0].padStart(2, "0")}`)
      }
    } else if (node.data.type === "schedule") {
      setScheduleFreq("daily")
      setScheduleTime("08:00")
      setScheduleDayOfWeek("1")
      setScheduleDayOfMonth("1")
    }
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
    setTempConfig({})
  }, [])

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => {
      const updatedNodes = [...nds]
      for (const change of changes) {
        if (change.type === "position" && change.position) {
          const nodeIndex = updatedNodes.findIndex(n => n.id === change.id)
          if (nodeIndex !== -1) {
            updatedNodes[nodeIndex] = { ...updatedNodes[nodeIndex], position: change.position }
          }
        }
        if (change.type === "remove") {
          const nodeIndex = updatedNodes.findIndex(n => n.id === change.id)
          if (nodeIndex !== -1) {
            updatedNodes.splice(nodeIndex, 1)
          }
        }
      }
      return updatedNodes
    })
  }, [])

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => {
      const updatedEdges = [...eds]
      for (const change of changes) {
        if (change.type === "remove") {
          const edgeIndex = updatedEdges.findIndex(e => e.id === change.id)
          if (edgeIndex !== -1) {
            updatedEdges.splice(edgeIndex, 1)
          }
        }
      }
      return updatedEdges
    })
  }, [])

  const handleTypeChange = (type: string) => {
    if (!selectedNode) return
    
    const labels = selectedNode.type === "trigger" ? triggerLabels : actionLabels
    const config: Record<string, string> = { type }
    
    if (type === "schedule") {
      config.cron = generateCronFromSchedule()
    } else if (type === "webhook") {
      config.endpoint = "/webhook"
    } else if (type === "shell") {
      config.command = "echo 'Hello'"
    }
    
    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, type, label: labels[type] || type, ...config } })
    setTempConfig(config)
  }

  const applyScheduleConfig = () => {
    if (!selectedNode) return
    const cron = generateCronFromSchedule()
    const config = { 
      cron, frequency: scheduleFreq, time: scheduleTime, 
      dayOfWeek: scheduleDayOfWeek, dayOfMonth: scheduleDayOfMonth,
      sublabel: `Cron: ${cron}`
    }
    
    setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? { ...n, data: { ...n.data, ...config } } : n))
    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, ...config } })
    setTempConfig(prev => ({ ...prev, ...config }))
    toast.success("Configurazione applicata")
  }

  const handleConfigChange = (key: string, value: string) => {
    setTempConfig(prev => ({ ...prev, [key]: value }))
  }

  const applyConfig = () => {
    if (!selectedNode) return
    setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? { ...n, data: { ...n.data, ...tempConfig } } : n))
    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, ...tempConfig } })
    toast.success("Configurazione applicata")
  }

  const onSave = async () => {
    if (!automationName.trim()) {
      toast.error("Inserisci un nome")
      return
    }

    const triggerNode = nodes.find((n) => n.type === "trigger")
    const actionNode = nodes.find((n) => n.type === "action")

    if (!triggerNode || !actionNode) {
      toast.error("Aggiungi Trigger e Azione")
      return
    }

    if (edges.length === 0) {
      toast.error("Connetti Trigger e Azione")
      return
    }

    // Make sure selected node changes are applied to nodes array
    if (selectedNode) {
      const config = Object.fromEntries(
        Object.entries(selectedNode.data).filter(([k]) => !["type", "label", "sublabel"].includes(k))
      )
      setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? { ...n, data: { ...n.data, ...config } } : n))
    }

    setIsSaving(true)
    try {
      const triggerConfig: Record<string, string> = {}
      const actionConfig: Record<string, string> = {}

      Object.entries(triggerNode.data).forEach(([key, value]) => {
        if (!["type", "label"].includes(key)) {
          triggerConfig[key] = value as string
        }
      })

      Object.entries(actionNode.data).forEach(([key, value]) => {
        if (!["type", "label"].includes(key)) {
          actionConfig[key] = value as string
        }
      })

      const body = {
        name: automationName,
        trigger: { type: triggerNode.data.type, ...triggerConfig },
        action: { type: actionNode.data.type, ...actionConfig },
        enabled: true,
      }

      const url = automationId ? `${API_URL}/automations/${automationId}` : `${API_URL}/automations`
      const response = await fetch(url, {
        method: automationId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        toast.success(automationId ? "Automazione aggiornata" : "Automazione creata")
        router.push("/")
      } else {
        const error = await response.json()
        toast.error(error.error || "Errore nel salvataggio")
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Errore nel salvataggio")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] flex">
      <div className="flex-1 h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
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
            <Button onClick={onSave} disabled={isSaving} size="lg">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Salvataggio..." : "Salva Automazione"}
            </Button>
          </Panel>
        </ReactFlow>
      </div>

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
                  onDragStart={(e) => e.dataTransfer.setData("itemType", "trigger")}
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
                  onDragStart={(e) => e.dataTransfer.setData("itemType", "action")}
                  className="flex items-center gap-2 p-3 bg-muted rounded-lg cursor-grab hover:bg-muted/80 transition-colors"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg text-sm">
          <p className="font-medium mb-2">Come usare:</p>
          <ol className="space-y-1 list-decimal list-inside text-muted-foreground">
            <li>Trascina un Trigger</li>
            <li>Trascina un'Azione</li>
            <li>Trascina i nodi dove vuoi</li>
            <li>Connetti (drag dal punto blu)</li>
            <li>Clicca per configurare</li>
            <li>Salva</li>
          </ol>
        </div>
      </div>

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
                    <SelectItem key={type} value={type}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {tempConfig.type === "schedule" && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Pianificazione
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Frequenza</Label>
                    <Select value={scheduleFreq} onValueChange={setScheduleFreq}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SCHEDULE_FREQUENCIES.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {scheduleFreq === "daily" && (
                    <div className="grid gap-2">
                      <Label>Orario</Label>
                      <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                    </div>
                  )}

                  {scheduleFreq === "weekly" && (
                    <div className="grid gap-2">
                      <Label>Giorno</Label>
                      <Select value={scheduleDayOfWeek} onValueChange={setScheduleDayOfWeek}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((day) => (
                            <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                    </div>
                  )}

                  {scheduleFreq === "monthly" && (
                    <div className="grid gap-2">
                      <Label>Giorno del mese</Label>
                      <Select value={scheduleDayOfMonth} onValueChange={setScheduleDayOfMonth}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_MONTH.map((day) => (
                            <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                    </div>
                  )}

                  {(scheduleFreq === "hourly" || scheduleFreq === "minutely") && (
                    <p className="text-sm text-muted-foreground">
                      {scheduleFreq === "hourly" ? "All'inizio di ogni ora" : "Ogni minuto"}
                    </p>
                  )}

                  <Button onClick={applyScheduleConfig} className="w-full">Applica</Button>
                </CardContent>
              </Card>
            )}

            {tempConfig.type === "webhook" && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Webhook</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Endpoint</Label>
                    <Input
                      value={tempConfig.endpoint || ""}
                      onChange={(e) => handleConfigChange("endpoint", e.target.value)}
                      placeholder="/webhook/my-trigger"
                    />
                  </div>
                  <Button onClick={applyConfig} className="w-full">Applica</Button>
                </CardContent>
              </Card>
            )}

            {tempConfig.type === "file_change" && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Monitora File</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Percorso</Label>
                    <Input
                      value={tempConfig.path || ""}
                      onChange={(e) => handleConfigChange("path", e.target.value)}
                      placeholder="~/Documents"
                    />
                  </div>
                  <Button onClick={applyConfig} className="w-full">Applica</Button>
                </CardContent>
              </Card>
            )}

            {tempConfig.type === "shell" && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Comando</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Preset</Label>
                    <Select
                      value={SHELL_PRESETS.find(p => p.command === tempConfig.command)?.label || ""}
                      onValueChange={(value) => {
                        const preset = SHELL_PRESETS.find(p => p.label === value)
                        if (preset) {
                          handleConfigChange("command", preset.command)
                        }
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                      <SelectContent>
                        {SHELL_PRESETS.map((preset) => (
                          <SelectItem key={preset.label} value={preset.label}>{preset.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Comando</Label>
                    <Input
                      value={tempConfig.command || ""}
                      onChange={(e) => handleConfigChange("command", e.target.value)}
                      placeholder="echo 'Hello'"
                    />
                  </div>
                  <Button onClick={applyConfig} className="w-full">Applica</Button>
                </CardContent>
              </Card>
            )}
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
