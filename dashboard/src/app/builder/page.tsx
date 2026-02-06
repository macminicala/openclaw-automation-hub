"use client"

import { Suspense, useCallback, useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ReactFlow,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  Controls,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  useReactFlow,
  Panel,
  MarkerType,
  NodeChange,
  EdgeChange,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ArrowLeft, Save, GripVertical, Clock, Settings, Mail, Bell, Globe, Folder, Calendar, Monitor, Trash2, GitBranch } from "lucide-react"
import { toast } from "sonner"

import {
  API_URL,
  triggerLabels,
  actionLabels,
  SHELL_PRESETS,
  SCHEDULE_FREQUENCIES,
  DAYS_OF_WEEK,
  DAYS_OF_MONTH,
  GIT_COMMANDS,
  SYSTEM_EVENTS,
  NOTIFY_CHANNELS,
} from "@/lib/constants/automation-config"
import { nodeTypes } from "@/components/flow-nodes"
import { ScheduleConfig, ShellConfig, WebhookConfig } from "@/components/builder/config-modals"


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
  const [deleteNodeId, setDeleteNodeId] = useState<string | null>(null)
  const [tempConfig, setTempConfig] = useState<Record<string, string>>({})

  const [scheduleFreq, setScheduleFreq] = useState("daily")
  const [scheduleTime, setScheduleTime] = useState("08:00")
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState("1")
  const [scheduleDayOfMonth, setScheduleDayOfMonth] = useState("1")

  // Refs to store handler functions for stable access from nodes
  const handlersRef = useRef<{
    onEdit: (nodeId: string) => void
    onDelete: (nodeId: string) => void
  } | null>(null)

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


  const confirmDelete = useCallback(() => {
    if (deleteNodeId) {
      setNodes((nds) => nds.filter(n => n.id !== deleteNodeId))
      setEdges((eds) => eds.filter(e => e.source !== deleteNodeId && e.target !== deleteNodeId))
      toast.success("Nodo eliminato")
      setDeleteNodeId(null)
    }
  }, [deleteNodeId])

  const closeConfig = useCallback(() => {
    setConfigNode(null)
    setTempConfig({})
  }, [])

  // Store handlers in ref and inject into nodes' data
  useEffect(() => {
    handlersRef.current = {
      onEdit: (nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId)
        if (node) {
          setConfigNode(node)
          const existingConfig: Record<string, string> = { type: node.data.type as string }
          Object.entries(node.data).forEach(([key, value]) => {
            if (!["type", "label", "sublabel", "onEdit", "onDelete"].includes(key) && typeof value === "string") {
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
          } else {
            setScheduleFreq("daily")
            setScheduleTime("08:00")
            setScheduleDayOfWeek("1")
            setScheduleDayOfMonth("1")
          }
        }
      },
      onDelete: (nodeId: string) => {
        setDeleteNodeId(nodeId)
      }
    }
  }, [nodes])

  // Inject handlers into nodes' data whenever a new node is added
  const nodesLengthRef = useRef(0)
  useEffect(() => {
    if (!handlersRef.current) return

    // Only run when nodes length changes (new node added)
    if (nodes.length !== nodesLengthRef.current) {
      nodesLengthRef.current = nodes.length

      // Check if any node is missing handlers
      const needsUpdate = nodes.some(node => !node.data.onEdit || !node.data.onDelete)
      if (needsUpdate) {
        setNodes(nds => nds.map(node => {
          if (!node.data.onEdit || !node.data.onDelete) {
            return {
              ...node,
              data: {
                ...node.data,
                onEdit: handlersRef.current?.onEdit,
                onDelete: handlersRef.current?.onDelete,
              }
            }
          }
          return node
        }))
      }
    }
  }, [nodes])

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  )

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
    toast.success("Configurazione salvata")
    closeConfig()
  }

  const handleConfigChange = (key: string, value: string) => {
    setTempConfig(prev => ({ ...prev, [key]: value }))
  }

  const applyConfig = () => {
    if (!configNode) return
    setNodes((nds) => nds.map((n) => n.id === configNode.id ? { ...n, data: { ...n.data, ...tempConfig, sublabel: tempConfig.command || tempConfig.endpoint || tempConfig.path || tempConfig.message || '' } } : n))
    toast.success("Configurazione salvata")
    closeConfig()
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
        if (!["type", "label", "sublabel", "onEdit", "onDelete"].includes(key) && typeof value !== "function") {
          triggerConfig[key] = value as string
        }
      })

      Object.entries(actionNode.data).forEach(([key, value]) => {
        if (!["type", "label", "sublabel", "onEdit", "onDelete"].includes(key) && typeof value !== "function") {
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
          <ScheduleConfig
            scheduleFreq={scheduleFreq}
            setScheduleFreq={setScheduleFreq}
            scheduleTime={scheduleTime}
            setScheduleTime={setScheduleTime}
            scheduleDayOfWeek={scheduleDayOfWeek}
            setScheduleDayOfWeek={setScheduleDayOfWeek}
            scheduleDayOfMonth={scheduleDayOfMonth}
            setScheduleDayOfMonth={setScheduleDayOfMonth}
            onSave={applyScheduleConfig}
          />
        )}

        {isTrigger && nodeType === "webhook" && (
          <WebhookConfig
            config={tempConfig}
            onConfigChange={handleConfigChange}
            onSave={applyConfig}
          />
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
          <ShellConfig
            config={tempConfig}
            onConfigChange={handleConfigChange}
            onSave={applyConfig}
          />
        )}

        {!isTrigger && nodeType === "ai_agent" && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Settings className="h-4 w-4" /> AI Agent</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2"><Label>Nome Agent</Label><Input value={tempConfig.agent || ""} onChange={(e) => handleConfigChange("agent", e.target.value)} placeholder="researcher" /></div>

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
          onPaneClick={() => { }}
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
            <li>Trascina un Azione</li>
            <li>Trascina i nodi dove vuoi</li>
            <li>Connetti (drag dal punto blu)</li>
            <li>Passa sopra un nodo e clicca la matita per configurare</li>
            <li>Clicca il cestino per eliminare</li>
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
              Sei sicuro di voler eliminare questo nodo? L azione non puo essere annullata.
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
