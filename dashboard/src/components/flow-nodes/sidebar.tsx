"use client"

import { 
  Calendar, 
  Clock, 
  Globe, 
  Mail, 
  FileText, 
  Monitor,
  Terminal, 
  Bot, 
  GitBranch, 
  Bell 
} from "lucide-react"

const triggerItems = [
  { type: "schedule", label: "Schedule", sublabel: "Cron expression", icon: Clock },
  { type: "webhook", label: "Webhook", sublabel: "HTTP endpoint", icon: Globe },
  { type: "file_change", label: "File Change", sublabel: "Monitor files", icon: FileText },
  { type: "email", label: "Email", sublabel: "IMAP trigger", icon: Mail },
  { type: "calendar", label: "Calendar", sublabel: "Event trigger", icon: Calendar },
  { type: "system", label: "System", sublabel: "System events", icon: Monitor },
]

const actionItems = [
  { type: "shell", label: "Shell", sublabel: "Execute command", icon: Terminal },
  { type: "ai_agent", label: "AI Agent", sublabel: "AI assistant", icon: Bot },
  { type: "git", label: "Git", sublabel: "Repository ops", icon: GitBranch },
  { type: "notify", label: "Notify", sublabel: "Send message", icon: Bell },
  { type: "email", label: "Email", sublabel: "Send email", icon: Mail },
]

export function Sidebar() {
  const onDragStart = (event: React.DragEvent, nodeType: string, itemType: string, label: string, sublabel: string) => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify({ nodeType, itemType, label, sublabel }))
    event.dataTransfer.effectAllowed = "move"
  }

  return (
    <div className="w-72 bg-card border-r h-full overflow-y-auto p-4">
      <h2 className="text-lg font-semibold mb-4">Automation Builder</h2>
      
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Triggers</h3>
        <div className="space-y-2">
          {triggerItems.map((item) => (
            <div
              key={item.type}
              className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg cursor-grab hover:bg-primary/20 transition-colors"
              draggable
              onDragStart={(e) => onDragStart(e, "trigger", item.type, item.label, item.sublabel)}
            >
              <item.icon className="w-5 h-5 text-primary" />
              <div>
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.sublabel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Actions</h3>
        <div className="space-y-2">
          {actionItems.map((item) => (
            <div
              key={item.type}
              className="flex items-center gap-3 p-3 bg-accent/20 border border-accent/30 rounded-lg cursor-grab hover:bg-accent/30 transition-colors"
              draggable
              onDragStart={(e) => onDragStart(e, "action", item.type, item.label, item.sublabel)}
            >
              <item.icon className="w-5 h-5 text-accent-foreground" />
              <div>
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.sublabel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
