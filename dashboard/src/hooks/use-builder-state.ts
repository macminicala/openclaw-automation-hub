"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, MarkerType } from "@xyflow/react"
import { toast } from "sonner"
import { API_URL, triggerLabels, actionLabels } from "@/lib/constants/automation-config"

export interface ScheduleState {
    frequency: string
    time: string
    dayOfWeek: string
    dayOfMonth: string
}

export interface BuilderState {
    // Flow state
    nodes: Node[]
    edges: Edge[]
    automationName: string
    automationId: string | null
    isSaving: boolean

    // Config modal state
    configNode: Node | null
    deleteNodeId: string | null
    tempConfig: Record<string, string>

    // Schedule specific state
    schedule: ScheduleState
}

export interface BuilderActions {
    // Flow actions
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
    setAutomationName: (name: string) => void
    onNodesChange: (changes: NodeChange[]) => void
    onEdgesChange: (changes: EdgeChange[]) => void
    onConnect: (params: Connection) => void

    // Config modal actions
    setConfigNode: (node: Node | null) => void
    setDeleteNodeId: (id: string | null) => void
    setTempConfig: React.Dispatch<React.SetStateAction<Record<string, string>>>
    closeConfig: () => void
    confirmDelete: () => void
    handleConfigChange: (key: string, value: string) => void
    handleTypeChange: (type: string) => void
    applyConfig: () => void

    // Schedule actions
    setScheduleFreq: (freq: string) => void
    setScheduleTime: (time: string) => void
    setScheduleDayOfWeek: (day: string) => void
    setScheduleDayOfMonth: (day: string) => void
    applyScheduleConfig: () => void
    generateCronFromSchedule: () => string

    // API actions
    loadAutomation: (id: string) => Promise<void>
    saveAutomation: () => Promise<void>
}

export function useBuilderState(initialAutomationId?: string): BuilderState & BuilderActions {
    // Core flow state
    const [nodes, setNodes] = useState<Node[]>([])
    const [edges, setEdges] = useState<Edge[]>([])
    const [automationName, setAutomationName] = useState("")
    const [automationId, setAutomationId] = useState<string | null>(initialAutomationId || null)
    const [isSaving, setIsSaving] = useState(false)

    // Config modal state
    const [configNode, setConfigNode] = useState<Node | null>(null)
    const [deleteNodeId, setDeleteNodeId] = useState<string | null>(null)
    const [tempConfig, setTempConfig] = useState<Record<string, string>>({})

    // Schedule state
    const [scheduleFreq, setScheduleFreq] = useState("daily")
    const [scheduleTime, setScheduleTime] = useState("08:00")
    const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState("1")
    const [scheduleDayOfMonth, setScheduleDayOfMonth] = useState("1")

    // Handlers ref for stable node access
    const handlersRef = useRef<{
        onEdit: (nodeId: string) => void
        onDelete: (nodeId: string) => void
    } | null>(null)

    // Generate cron expression from schedule state
    const generateCronFromSchedule = useCallback(() => {
        const [hours, minutes] = scheduleTime.split(":")
        switch (scheduleFreq) {
            case "minutely": return "* * * * *"
            case "hourly": return `0 * * * *`
            case "daily": return `${minutes} ${hours} * * *`
            case "weekly": return `${minutes} ${hours} * * ${scheduleDayOfWeek}`
            case "monthly": return `${minutes} ${hours} ${scheduleDayOfMonth} * *`
            default: return `${minutes} ${hours} * * *`
        }
    }, [scheduleFreq, scheduleTime, scheduleDayOfWeek, scheduleDayOfMonth])

    // Load automation from API
    const loadAutomation = useCallback(async (id: string) => {
        try {
            const response = await fetch(`${API_URL}/automations/${id}`)
            if (response.ok) {
                const data = await response.json()
                setAutomationName(data.name || "")
                setAutomationId(id)

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
    }, [])

    // Flow handlers
    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    )

    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    )

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        []
    )

    // Config modal handlers
    const closeConfig = useCallback(() => {
        setConfigNode(null)
        setTempConfig({})
    }, [])

    const confirmDelete = useCallback(() => {
        if (deleteNodeId) {
            setNodes((nds) => nds.filter(n => n.id !== deleteNodeId))
            setEdges((eds) => eds.filter(e => e.source !== deleteNodeId && e.target !== deleteNodeId))
            toast.success("Nodo eliminato")
            setDeleteNodeId(null)
        }
    }, [deleteNodeId])

    const handleConfigChange = useCallback((key: string, value: string) => {
        setTempConfig(prev => ({ ...prev, [key]: value }))
    }, [])

    const handleTypeChange = useCallback((type: string) => {
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
    }, [configNode, generateCronFromSchedule])

    const applyScheduleConfig = useCallback(() => {
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
    }, [configNode, generateCronFromSchedule, scheduleFreq, scheduleTime, scheduleDayOfWeek, scheduleDayOfMonth, closeConfig])

    const applyConfig = useCallback(() => {
        if (!configNode) return
        setNodes((nds) => nds.map((n) => n.id === configNode.id ? {
            ...n,
            data: {
                ...n.data,
                ...tempConfig,
                sublabel: tempConfig.command || tempConfig.endpoint || tempConfig.path || tempConfig.message || ''
            }
        } : n))
        toast.success("Configurazione salvata")
        closeConfig()
    }, [configNode, tempConfig, closeConfig])

    // Save automation
    const saveAutomation = useCallback(async () => {
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
                return // Let the caller handle navigation
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
    }, [automationName, automationId, nodes, edges])

    // Handler injection effect
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

                    // Parse schedule cron if applicable
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

    // Inject handlers into nodes
    const nodesLengthRef = useRef(0)
    useEffect(() => {
        if (!handlersRef.current) return

        if (nodes.length !== nodesLengthRef.current) {
            nodesLengthRef.current = nodes.length

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

    return {
        // State
        nodes,
        edges,
        automationName,
        automationId,
        isSaving,
        configNode,
        deleteNodeId,
        tempConfig,
        schedule: {
            frequency: scheduleFreq,
            time: scheduleTime,
            dayOfWeek: scheduleDayOfWeek,
            dayOfMonth: scheduleDayOfMonth,
        },

        // Actions
        setNodes,
        setEdges,
        setAutomationName,
        onNodesChange,
        onEdgesChange,
        onConnect,
        setConfigNode,
        setDeleteNodeId,
        setTempConfig,
        closeConfig,
        confirmDelete,
        handleConfigChange,
        handleTypeChange,
        applyConfig,
        setScheduleFreq,
        setScheduleTime,
        setScheduleDayOfWeek,
        setScheduleDayOfMonth,
        applyScheduleConfig,
        generateCronFromSchedule,
        loadAutomation,
        saveAutomation,
    }
}
