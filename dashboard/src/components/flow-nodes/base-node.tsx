"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Edit3, Trash2, Settings } from "lucide-react"
import { getNodeLabelInfo, getNodeColor } from "@/lib/constants/automation-config"

export interface BaseNodeData extends Record<string, unknown> {
    type: string
    label: string
    sublabel?: string
    onEdit?: (id: string) => void
    onDelete?: (id: string) => void
}

interface BaseNodeProps extends NodeProps {
    data: BaseNodeData
    nodeType: "trigger" | "action"
}

export function BaseNode({ id, data, isConnectable, nodeType }: BaseNodeProps) {
    const colorClass = getNodeColor(data.type, nodeType)
    const labelInfo = getNodeLabelInfo(data.type, nodeType)
    const Icon = labelInfo.icon || Settings

    const onEdit = data.onEdit
    const onDelete = data.onDelete

    return (
        <div className={`${colorClass} rounded-lg p-3 min-w-[160px] shadow-lg text-white select-none relative group`}>
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-white"
            />

            <div className="flex items-center gap-2 pr-6">
                <Icon className="w-5 h-5" />
                <div>
                    <div className="text-sm font-bold">{data.label}</div>
                    <div className="text-xs opacity-80 truncate max-w-[100px]">
                        {data.sublabel || data.type}
                    </div>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-white"
            />

            {/* Hover actions */}
            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit?.(id) }}
                    className="p-1 bg-white rounded-full shadow hover:bg-gray-100 nodrag nopan"
                    title="Modifica"
                >
                    <Edit3 className="w-3 h-3 text-gray-700" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete?.(id) }}
                    className="p-1 bg-white rounded-full shadow hover:bg-red-100 nodrag nopan"
                    title="Elimina"
                >
                    <Trash2 className="w-3 h-3 text-red-600" />
                </button>
            </div>
        </div>
    )
}
