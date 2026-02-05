"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import { 
  Terminal, 
  Bot, 
  GitBranch, 
  Bell, 
  Mail 
} from "lucide-react"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  shell: Terminal,
  ai_agent: Bot,
  git: GitBranch,
  notify: Bell,
  email: Mail,
}

export function ActionNode({ data }: NodeProps) {
  const Icon = iconMap[data.type as string] || Terminal
  
  return (
    <div className="bg-accent/20 border-2 border-accent rounded-lg p-3 min-w-[150px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-accent" />
      
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-accent-foreground" />
        <div>
          <div className="text-sm font-medium">{data.label as string}</div>
          <div className="text-xs text-muted-foreground">{data.sublabel as string}</div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-accent" />
    </div>
  )
}
