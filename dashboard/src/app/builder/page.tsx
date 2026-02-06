"use client"

import { Suspense, useCallback, useState, useEffect, useRef } from "react"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ArrowLeft, Save, GripVertical, Calendar, Settings, Mail, Monitor, GitBranch, Bell, Folder, Globe, Clock, Edit3, Trash2 } from "lucide-react"
import { toast } from "sonner"

const API_URL = "http://localhost:18799/api"

const triggerLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  schedule: { label: "Schedule", icon: Clock },
  webhook: { label: "Webhook", icon: Globe },
  file_change: { label: "File Change", icon: Folder },
  email: { label: "Email", icon: Mail },
  calendar: { label: "Calendar", icon: Calendar },
  system: { label: "System", icon: Monitor },
}

const actionLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  shell: { label: "Shell", icon: Settings },
  ai_agent: { label: "AI Agent", icon: Settings },
  git: { label: "Git", icon: GitBranch },
  notify: { label: "Notify", icon: Bell },
  email: { label: "Email", icon: Mail },
}

const SHELL_PRESETS = [
  { label: "Backup cartella", command: "cp -r ~/Documents ~/Documents_backup_$(date +%Y%m%d)" },
  { label: "Pull Git", command: "cd ~/Projects && git pull origin main" },
  { label: "npm install", command: "cd ~/Projects && npm install" },
  { label: "npm build", command: "cd ~/Projects && npm run build" },
  { label: "Docker compose up", command: "cd ~/Projects && docker compose up -d" },
  { label: "Free memory", command: "sudo purge" },
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

const GIT_COMMANDS = [
  { label: "Pull", command: "git pull origin main" },
  { label: "Push", command: "git push origin main" },
  { label: "Clone", command: "git clone <repository>" },
  { label: "Checkout", command: "git checkout <branch>" },
  { label: "Status", command: "git status" },
  { label: "Log", command: "git log --oneline -10" },
]

const SYSTEM_EVENTS = [
  { label: "Login utente", value: "user.login" },
  { label: "Logout utente", value: "user.logout" },
  { label: "Avvio sistema", value: "system.startup" },
  { label: "Spegnimento", value: "system.shutdown" },
  { label: "Errore critico", value: "system.error" },
  { label: "Batteria bassa", value: "system.low_battery" },
]

const NOTIFY_CHANNELS = [
  { label: "Notifica sistema", value: "system" },
  { label: "Email", value: "email" },
  { label: "Push notification", value: "push" },
  { label: "Telegram", value: "telegram" },
]

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
  const Icon = triggerLabels[data.type as string]?.icon || Settings

  return (
    <div className={`${colorClass} rounded-lg p-3 min-w-[160px] shadow-lg text-white cursor-grab active:cursor-grabbing select-none relative group`}>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-white" />
      <div className="flex items-center gap-2 pointer-events-none pr-6">
        <Icon className="w-5 h-5" />
        <div>
          <div className="text-sm font-bold">{data.label as string}</div>
          <div className="text-xs opacity-80 truncate max-w-[100px]">{data.sublabel as string || data.type}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-white" />
      
      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("editNode", { detail: data })) }}
          className="p-1 bg-white rounded-full shadow hover:bg-gray-100"
        >
          <Edit3 className="w-3 h-3 text-gray-700" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("deleteNode", { detail: data.id })) }}
          className="p-1 bg-white rounded-full shadow hover:bg-red-100"
        >
          <Trash2 className="w-3 h-3 text-red-600" />
        </button>
      </div>
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
  const Icon = actionLabels[data.type as string]?.icon || Settings

  return (
    <div className={`${colorClass} rounded-lg p-3 min-w-[160px] shadow-lg text-white cursor-grab active:cursor-grabbing select-none relative group`}>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-white" />
      <div className="flex items-center gap-2 pointer-events-none pr-6">
        <Icon className="w-5 h-5" />
        <div>
          <div className="text-sm font-bold">{data.label as string}</div>
          <div className="text-xs opacity-80 truncate max-w-[100px]">{data.sublabel as string || data.type}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-white" />
      
      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("editNode", { detail: data })) }}
          className="p-1 bg-white rounded-full shadow hover:bg-gray-100"
        >
          <Edit3 className="w-3 h-3 text-gray-700" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("deleteNode", { detail: data.id })) }}
          className="p-1 bg-white rounded-full shadow hover:bg-red-100"
        >
          <Trash2 className="w-3 h-3 text-red-600" />
        </button>
      </div>
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
  const [configNode, setConfigNode] = useState<Node | null>(null)
  const openConfigRef = useRef<(node: Node) => void>(() => {})
  const [deleteNodeId, setDeleteNodeId] = useState<string | null>(null)
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

  useEffect(() => {
    const handleEditNode = (e: Event) => {
      const nodeData = (e as CustomEvent).detail
      const node = nodes.find(n => n.id === nodeData.id)
      if (node) openConfigRef.current(node)
    }

    const handleDeleteNode = (e: Event) => {
      const nodeId = (e as CustomEvent).detail
      setDeleteNodeId(nodeId)
    }

    window.addEventListener("editNode", handleEditNode)
    window.addEventListener("deleteNode", handleDeleteNode)

    return () => {
      window.removeEventListener("editNode", handleEditNode)
      window.removeEventListener("deleteNode", handleDeleteNode)
    }
  }, [nodes])

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
            label: triggerLabels[data.trigger?.type]?.label || "Trigger",
            ...data.trigger
          },
        }
        
        const actionNode: Node = {
          id: "action",
          type: "action",
          position: { x: 500, y: 200 },
          data: { 
            type: data.actions?.[0]?.type || "shell",
            label: actionLabels[data.actions?.[0]?.type]?.label || "Action",
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
      const nodeType = event.dataTransfer.getData("nodeType")
      if (!itemType) return

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      const labels = itemType === "trigger" ? triggerLabels : actionLabels
      const defaultType = nodeType || (itemType === "trigger" ? "schedule" : "shell")
      const defaultLabel = labels[defaultType as keyof typeof labels]?.label || (itemType === "trigger" ? "Trigger" : "Action")

      const newNode: Node = {
        id: `${itemType}-${Date.now()}`,
        type: itemType,
        position,
        data: { 
          type: defaultType,
          label: defaultLabel,
        },
      }

      setNodes((nds) => [...nds, newNode])
    },
    [screenToFlowPosition],
  )

  const openConfig = useCallback((node: Node) => {
    setConfigNode(node)
    openConfigRef.current(node)
    
    const existingConfig: Record<string, string> = { type: node.data.type as string }
    Object.entries(node.data).forEach(([key, value]) => {
      if (!["type", "label", "sublabel"].includes(key) && typeof value === "string") {
        existingConfig[key] = value
      }
    })
    setTempConfig(existingConfig)
    
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

  const closeConfig = useCallback(() => {
    setConfigNode(null)
    setTempConfig({})
  }, [])

  const confirmDelete = () => {
    if (deleteNodeId) {
      setNodes((nds) => nds.filter(n => n.id !== deleteNodeId))
      setEdges((eds) => eds.filter(e => e.source !== deleteNodeId && e.target !== deleteNodeId))
      toast.success("Nodo eliminato")
      setDeleteNodeId(null)
    }
  }

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
    if (!configNode) return
    
    const labels = configNode.type === "trigger" ? triggerLabels : actionLabels
    const config: Record<string, string> = { type }
    
    if (type === "schedule") {
      config.cron = generateCronFromSchedule()
    } else if (type === "webhook") {
      config.endpoint = "/webhook"
    } else if (type === "shell") {
      config.command = "echo 'Hello'"
    }
    
    setConfigNode({ 
      ...configNode, 
      data: { ...configNode.data, type, label: labels[type as keyof typeof labels]?.label || type, ...config } 
    })
    setTempConfig(config)
  }

  const applyScheduleConfig = () => {
    if (!configNode) return
    const cron = generateCronFromSchedule()
    const config = { 
      cron, frequency: scheduleFreq, time: scheduleTime, 
      dayOfWeek: scheduleDayOfWeek, dayOfMonth: scheduleDayOfMonth,
      sublabel: `Cron: ${cron}`
    }
    
    setNodes((nds) => nds.map((n) => n.id === configNode.id ? { ...n, data: { ...n.data, ...config } } : n))
    setConfigNode({ ...configNode, data: { ...configNode.data, ...config } })
    setTempConfig(prev => ({ ...prev, ...config }))
    toast.success("Configurazione salvata")
  }

  const handleConfigChange = (key: string, value: string) => {
    setTempConfig(prev => ({ ...prev, [key]: value }))
  }

  const applyConfig = () => {
    if (!configNode) return
    setNodes((nds) => nds.map((n) => n.id === configNode.id ? { ...n, data: { ...n.data, ...tempConfig } } : n))
    setConfigNode({ ...configNode, data: { ...configNode.data, ...tempConfig } })
    toast.success("Configurazione salvata")
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

    setIsSaving(true)
    try {
      const triggerConfig: Record<string, string> = {}
      const actionConfig: Record<string, string> = {}

      Object.entries(triggerNode.data).forEach(([key, value]) => {
        if (!["type", "label", "sublabel"].includes(key)) {
          triggerConfig[key] = value as string
        }
      })

      Object.entries(actionNode.data).forEach(([key, value]) => {
        if (!["type", "label", "sublabel"].includes(key)) {
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

  const renderConfigContent = () => {
    if (!configNode) return null

    const nodeType = (tempConfig.type || configNode.data.type) as string
    const isTrigger = configNode.type === "trigger"

    return (
      <>
        <div className="grid gap-2">
          <Label>Tipo</Label>
          <Select value={nodeType} onValueChange={handleTypeChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(isTrigger ? triggerLabels : actionLabels).map(([type, info]) => (
                <SelectItem key={type} value={type}>{info.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isTrigger && nodeType === "schedule" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" /> Pianificazione</CardTitle>
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
              {scheduleFreq === "daily" && <div className="grid gap-2"><Label>Orario</Label><Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} /></div>}
              {scheduleFreq === "weekly" && (
                <div className="grid gap-2">
                  <Label>Giorno</Label>
                  <Select value={scheduleDayOfWeek} onValueChange={setScheduleDayOfWeek}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{DAYS_OF_WEEK.map((day) => (<SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>))}</SelectContent>
                  </Select>
                  <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                </div>
              )}
              {scheduleFreq === "monthly" && (
                <div className="grid gap-2">
                  <Label>Giorno del mese</Label>
                  <Select value={scheduleDayOfMonth} onValueChange={setScheduleDayOfMonth}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{DAYS_OF_MONTH.map((day) => (<SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>))}</SelectContent>
                  </Select>
                  <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                </div>
              )}
              {(scheduleFreq === "hourly" || scheduleFreq === "minutely") && <p className="text-sm text-muted-foreground">{scheduleFreq === "hourly" ? "All'inizio di ogni ora" : "Ogni minuto"}</p>}
              <Button onClick={applyScheduleConfig} className="w-full">Salva</Button>
            </CardContent>
          </Card>
        )}

        {isTrigger && nodeType === "webhook" && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4" /> Webhook</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2"><Label>Endpoint</Label><Input value={tempConfig.endpoint || ""} onChange={(e) => handleConfigChange("endpoint", e.target.value)} placeholder="/webhook/my-trigger" /></div>
              <p className="text-xs text-muted-foreground">Endpoint: /api/webhook{ tempConfig.endpoint || "/..." }</p>
              <Button onClick={applyConfig} className="w-full">Salva</Button>
            </CardContent>
          </Card>
        )}

        {isTrigger && nodeType === "file_change" && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Folder className="h-4 w-4" /> Monitora File</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2"><Label>Percorso</Label><Input value={tempConfig.path || ""} onChange={(e) => handleConfigChange("path", e.target.value)} placeholder="~/Documents" /></div>
              <div className="grid gap-2">
                <Label>Evento</Label>
                <Select value={tempConfig.event || "change"} onValueChange={(v) => handleConfigChange("event", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="change">Modifica</SelectItem>
                    <SelectItem value="create">Creazione</SelectItem>
                    <SelectItem value="delete">Eliminazione</SelectItem>
                    <SelectItem value="rename">Rinominazione</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={applyConfig} className="w-full">Salva</Button>
            </CardContent>
          </Card>
        )}

        {isTrigger && nodeType === "email" && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4" /> Email</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2"><Label>Da (mittente)</Label><Input type="email" value={tempConfig.from || ""} onChange={(e) => handleConfigChange("from", e.target.value)} placeholder="noreply@example.com" /></div>
              <div className="grid gap-2"><Label>Oggetto contiene</Label><Input value={tempConfig.subject_contains || ""} onChange={(e) => handleConfigChange("subject_contains", e.target.value)} placeholder="/password reset" /></div>
              <div className="grid gap-2"><Label>Mittente contiene</Label><Input value={tempConfig.sender_contains || ""} onChange={(e) => handleConfigChange("sender_contains", e.target.value)} placeholder="@company.com" /></div>
              <Button onClick={applyConfig} className="w-full">Salva</Button>
            </CardContent>
          </Card>
        )}

        {isTrigger && nodeType === "calendar" && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" /> Calendario</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2"><Label>ID Calendario</Label><Input value={tempConfig.calendar_id || ""} onChange={(e) => handleConfigChange("calendar_id", e.target.value)} placeholder="primary" /></div>
              <div className="grid gap-2">
                <Label>Tipo evento</Label>
                <Select value={tempConfig.event_type || "any"} onValueChange={(v) => handleConfigChange("event_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Qualsiasi</SelectItem>
                    <SelectItem value="created">Creato</SelectItem>
                    <SelectItem value="updated">Aggiornato</SelectItem>
                    <SelectItem value="cancelled">Cancellato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Minuti prima</Label><Input type="number" value={tempConfig.minutes_before || "15"} onChange={(e) => handleConfigChange("minutes_before", e.target.value)} placeholder="15" /></div>
              <Button onClick={applyConfig} className="w-full">Salva</Button>
            </CardContent>
          </Card>
        )}

        {isTrigger && nodeType === "system" && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Monitor className="h-4 w-4" /> Sistema</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Evento</Label>
                <Select value={tempConfig.event || ""} onValueChange={(v) => handleConfigChange("event", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SYSTEM_EVENTS.map((event) => (<SelectItem key={event.value} value={event.value}>{event.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={applyConfig} className="w-full">Salva</Button>
            </CardContent>
          </Card>
        )}

        {!isTrigger && nodeType === "shell" && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Settings className="h-4 w-4" /> Shell</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Preset</Label>
                <Select value={SHELL_PRESETS.find(p => p.command === tempConfig.command)?.label || ""} onValueChange={(value) => { const preset = SHELL_PRESETS.find(p => p.label === value); if (preset) handleConfigChange("command", preset.command) }}>
                  <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                  <SelectContent>
                    {SHELL_PRESETS.map((preset) => (<SelectItem key={preset.label} value={preset.label}>{preset.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Comando</Label><Input value={tempConfig.command || ""} onChange={(e) => handleConfigChange("command", e.target.value)} placeholder="echo 'Hello'" /></div>
              <div className="grid gap-2"><Label>Working Directory</Label><Input value={tempConfig.working_dir || ""} onChange={(e) => handleConfigChange("working_dir", e.target.value)} placeholder="~/Projects" /></div>
              <div className="grid gap-2"><Label>Timeout (secondi)</Label><Input type="number" value={tempConfig.timeout || "60"} onChange={(e) => handleConfigChange("timeout", e.target.value)} placeholder="60" /></div>
              <Button onClick={applyConfig} className="w-full">Salva</Button>
            </CardContent>
          </Card>
        )}

        {!isTrigger && nodeType === "ai_agent" && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Settings className="h-4 w-4" /> AI Agent</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2"><Label>Nome Agent</Label><Input value={tempConfig.agent || ""} onChange={(e) => handleConfigChange("agent", e.target.value)} placeholder="researcher" /></div>
              <div className="grid gap-2"><Label>Istruzioni</Label><Input value={tempConfig.instructions || ""} onChange={(e) => handleConfigChange("instructions", e.target.value)} placeholder="Cerca informazioni su..." /></div>
              <div className="grid gap-2">
                <Label>Model</Label>
                <Select value={tempConfig.model || "default"} onValueChange={(v) => handleConfigChange("model", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="claude-3">Claude 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={applyConfig} className="w-full">Salva</Button>
            </CardContent>
          </Card>
        )}

        {!isTrigger && nodeType === "git" && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><GitBranch className="h-4 w-4" /> Git</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Comando</Label>
                <Select value={GIT_COMMANDS.find(c => c.command === tempConfig.command)?.label || ""} onValueChange={(value) => { const cmd = GIT_COMMANDS.find(c => c.label === value); if (cmd) handleConfigChange("command", cmd.command) }}>
                  <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                  <SelectContent>
                    {GIT_COMMANDS.map((cmd) => (<SelectItem key={cmd.label} value={cmd.label}>{cmd.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Repository</Label><Input value={tempConfig.repository || ""} onChange={(e) => handleConfigChange("repository", e.target.value)} placeholder="https://github.com/user/repo" /></div>
              <div className="grid gap-2"><Label>Branch</Label><Input value={tempConfig.branch || ""} onChange={(e) => handleConfigChange("branch", e.target.value)} placeholder="main" /></div>
              <Button onClick={applyConfig} className="w-full">Salva</Button>
            </CardContent>
          </Card>
        )}

        {!isTrigger && nodeType === "notify" && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4" /> Notifica</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Canale</Label>
                <Select value={tempConfig.channel || ""} onValueChange={(v) => handleConfigChange("channel", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NOTIFY_CHANNELS.map((ch) => (<SelectItem key={ch.value} value={ch.value}>{ch.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Messaggio</Label><Input value={tempConfig.message || ""} onChange={(e) => handleConfigChange("message", e.target.value)} placeholder="Notifica..." /></div>
              <div className="grid gap-2"><Label>Destinatario (opzionale)</Label><Input value={tempConfig.recipient || ""} onChange={(e) => handleConfigChange("recipient", e.target.value)} placeholder="@user o email" /></div>
              <Button onClick={applyConfig} className="w-full">Salva</Button>
            </CardContent>
          </Card>
        )}

        {!isTrigger && nodeType === "email" && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4" /> Invia Email</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2"><Label>Destinatario</Label><Input type="email" value={tempConfig.to || ""} onChange={(e) => handleConfigChange("to", e.target.value)} placeholder="user@example.com" /></div>
              <div className="grid gap-2"><Label>Oggetto</Label><Input value={tempConfig.subject || ""} onChange={(e) => handleConfigChange("subject", e.target.value)} placeholder="Oggetto email" /></div>
              <div className="grid gap-2"><Label>Corpo</Label><Input value={tempConfig.body || ""} onChange={(e) => handleConfigChange("body", e.target.value)} placeholder="Contenuto email" /></div>
              <Button onClick={applyConfig} className="w-full">Salva</Button>
            </CardContent>
          </Card>
        )}
      </>
    )
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
          onNodeClick={() => {}}
          onPaneClick={closeConfig}
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
              {Object.entries(triggerLabels).map(([type, info]) => (
                <div
                  key={type}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("itemType", "trigger")
                    e.dataTransfer.setData("nodeType", type)
                  }}
                  className="flex items-center gap-2 p-3 bg-muted rounded-lg cursor-grab hover:bg-muted/80 transition-colors"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span>{info.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Actions</h4>
            <div className="space-y-2">
              {Object.entries(actionLabels).map(([type, info]) => (
                <div
                  key={type}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("itemType", "action")
                    e.dataTransfer.setData("nodeType", type)
                  }}
                  className="flex items-center gap-2 p-3 bg-muted rounded-lg cursor-grab hover:bg-muted/80 transition-colors"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span>{info.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg text-sm">
          <p className="font-medium mb-2">Come usare:</p>
          <ol className="space-y-1 list-decimal list-inside text-muted-foreground">
            <li>Trascina un Trigger</li>
            <li>Trascina un&apos;Azione</li>
            <li>Trascina i nodi dove vuoi</li>
            <li>Connetti (drag dal punto blu)</li>
            <li>Clicca per configurare</li>
            <li>Salva</li>
          </ol>
        </div>
      </div>

      <Dialog open={!!configNode} onOpenChange={(open) => !open && closeConfig()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {configNode?.type === "trigger" ? "Configura Trigger" : "Configura Azione"}
            </DialogTitle>
            <DialogDescription>
              Modifica le impostazioni del nodo
            </DialogDescription>
          </DialogHeader>
          {renderConfigContent()}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteNodeId} onOpenChange={(open) => !open && setDeleteNodeId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Elimina Nodo
            </DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare questo nodo? L&apos;azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setDeleteNodeId(null)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Elimina
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
