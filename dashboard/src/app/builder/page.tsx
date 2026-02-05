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
  Panel
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save } from "lucide-react"
import { nodeTypes, type NodeType } from "@/components/flow-nodes"
import { Sidebar } from "@/components/flow-nodes/sidebar"
import { toast } from "sonner"

const API_URL = "http://localhost:18799/api"

interface DragData {
  nodeType: NodeType
  itemType: string
  label: string
  sublabel: string
}

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

function BuilderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { screenToFlowPosition } = useReactFlow()
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [automationName, setAutomationName] = useState("")
  const [automationId, setAutomationId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const id = searchParams.get("id")
    if (id) {
      setAutomationId(id)
      loadAutomation(id)
    }
  }, [searchParams])

  const loadAutomation = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/automations/${id}`)
      if (response.ok) {
        const data = await response.json()
        setAutomationName(data.name || "")
        
        const triggerNode: Node = {
          id: "trigger",
          type: "trigger",
          position: { x: 100, y: 200 },
          data: { 
            type: data.trigger?.type || "schedule",
            label: triggerLabels[data.trigger?.type] || "Trigger",
            sublabel: "Configured trigger"
          },
        }
        
        const actionNode: Node = {
          id: "action",
          type: "action",
          position: { x: 500, y: 200 },
          data: { 
            type: data.actions?.[0]?.type || "shell",
            label: actionLabels[data.actions?.[0]?.type] || "Action",
            sublabel: "Configured action"
          },
        }
        
        setNodes([triggerNode, actionNode])
      }
    } catch (error) {
      console.error("Error loading automation:", error)
      toast.error("Errore nel caricamento dell'automazione")
    } finally {
      setIsLoading(false)
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
      const type = event.dataTransfer.getData("application/reactflow")
      const itemType = event.dataTransfer.getData("itemType")
      const label = event.dataTransfer.getData("label")
      const sublabel = event.dataTransfer.getData("sublabel")

      if (typeof type === "undefined" || !type) return

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newNode: Node = {
        id: `${itemType}-${Date.now()}`,
        type: itemType === "trigger" || itemType === "action" ? itemType : "trigger",
        position,
        data: { type, label, sublabel },
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [screenToFlowPosition],
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: n.id === node.id ? { ...n.data, selected: true } : { ...n.data, selected: false },
      }))
    )
  }, [])

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
      Object.entries(triggerNode.data).forEach(([key, value]) => {
        if (key !== "type" && key !== "label" && key !== "sublabel" && key !== "selected") {
          triggerConfig[key] = value as string
        }
      })

      const actionConfig: Record<string, string> = {}
      Object.entries(actionNode.data).forEach(([key, value]) => {
        if (key !== "type" && key !== "label" && key !== "sublabel" && key !== "selected") {
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
        toast.error("Errore nel salvataggio dell'automazione")
      }
    } catch (error) {
      console.error("Error saving automation:", error)
      toast.error("Errore nel salvataggio dell'automazione")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] flex">
      <div className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
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
            <Button 
              onClick={onSave} 
              disabled={isSaving || isLoading}
              size="lg"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Salvataggio..." : "Salva Automazione"}
            </Button>
          </Panel>
        </ReactFlow>
      </div>
      <Sidebar />
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
