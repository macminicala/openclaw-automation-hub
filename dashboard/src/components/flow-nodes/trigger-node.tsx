"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import { 
  Calendar, 
  Clock, 
  Globe, 
  Mail, 
  FileText, 
  Monitor 
} from "lucide-react"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  schedule: Clock,
  webhook: Globe,
  file_change: FileText,
  email: Mail,
  calendar: Calendar,
  system: Monitor,
}

export function TriggerNode({ data }: NodeProps) {
  const Icon = iconMap[data.type as string] || Clock
  
  return (
    <div className="bg-primary/10 border-2 border-primary rounded-lg p-3 min-w-[150px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-primary" />
      
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-primary" />
        <div>
          <div className="text-sm font-medium">{data.label as string}</div>
          <div className="text-xs text-muted-foreground">{data.sublabel as string}</div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-primary" />
    </div>
  )
}
