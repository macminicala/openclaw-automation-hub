import { Calendar, Clock, Folder, Globe, Mail, Monitor, Settings, GitBranch, Bell } from "lucide-react"

export const API_URL = "http://localhost:18799/api"

// Node type definitions with labels and icons
export const triggerLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
    schedule: { label: "Schedule", icon: Clock },
    webhook: { label: "Webhook", icon: Globe },
    file_change: { label: "File Change", icon: Folder },
    email: { label: "Email", icon: Mail },
    calendar: { label: "Calendar", icon: Calendar },
    system: { label: "System", icon: Monitor },
}

export const actionLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
    shell: { label: "Shell", icon: Settings },
    ai_agent: { label: "AI Agent", icon: Settings },
    git: { label: "Git", icon: GitBranch },
    notify: { label: "Notify", icon: Bell },
    email: { label: "Email", icon: Mail },
}

// Color mappings for node types
export const triggerColors: Record<string, string> = {
    schedule: "bg-blue-500 border-blue-600",
    webhook: "bg-green-500 border-green-600",
    file_change: "bg-purple-500 border-purple-600",
    email: "bg-yellow-500 border-yellow-600",
    calendar: "bg-pink-500 border-pink-600",
    system: "bg-red-500 border-red-600",
}

export const actionColors: Record<string, string> = {
    shell: "bg-orange-500 border-orange-600",
    ai_agent: "bg-indigo-500 border-indigo-600",
    git: "bg-gray-600 border-gray-700",
    notify: "bg-teal-500 border-teal-600",
    email: "bg-cyan-500 border-cyan-600",
}

// Preset configurations
export const SHELL_PRESETS = [
    { label: "Backup cartella", command: "cp -r ~/Documents ~/Documents_backup_$(date +%Y%m%d)" },
    { label: "Pull Git", command: "cd ~/Projects && git pull origin main" },
    { label: "npm install", command: "cd ~/Projects && npm install" },
    { label: "npm build", command: "cd ~/Projects && npm run build" },
    { label: "Docker compose up", command: "cd ~/Projects && docker compose up -d" },
    { label: "Free memory", command: "sudo purge" },
]

export const SCHEDULE_FREQUENCIES = [
    { value: "minutely", label: "Ogni minuto" },
    { value: "hourly", label: "Ogni ora" },
    { value: "daily", label: "Ogni giorno" },
    { value: "weekly", label: "Ogni settimana" },
    { value: "monthly", label: "Ogni mese" },
]

export const DAYS_OF_WEEK = [
    { value: "1", label: "Lunedì" },
    { value: "2", label: "Martedì" },
    { value: "3", label: "Mercoledì" },
    { value: "4", label: "Giovedì" },
    { value: "5", label: "Venerdì" },
    { value: "6", label: "Sabato" },
    { value: "0", label: "Domenica" },
]

export const DAYS_OF_MONTH = Array.from({ length: 28 }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1}`
}))

export const GIT_COMMANDS = [
    { label: "Pull", command: "git pull origin main" },
    { label: "Push", command: "git push origin main" },
    { label: "Clone", command: "git clone <repository>" },
    { label: "Checkout", command: "git checkout <branch>" },
    { label: "Status", command: "git status" },
    { label: "Log", command: "git log --oneline -10" },
]

export const SYSTEM_EVENTS = [
    { label: "Login utente", value: "user.login" },
    { label: "Logout utente", value: "user.logout" },
    { label: "Avvio sistema", value: "system.startup" },
    { label: "Spegnimento", value: "system.shutdown" },
    { label: "Errore critico", value: "system.error" },
    { label: "Batteria bassa", value: "system.low_battery" },
]

export const NOTIFY_CHANNELS = [
    { label: "Notifica sistema", value: "system" },
    { label: "Email", value: "email" },
    { label: "Push notification", value: "push" },
    { label: "Telegram", value: "telegram" },
]

// Helper to get label info
export function getNodeLabelInfo(type: string, nodeType: "trigger" | "action") {
    const labels = nodeType === "trigger" ? triggerLabels : actionLabels
    return labels[type] || { label: type, icon: Settings }
}

// Helper to get node color
export function getNodeColor(type: string, nodeType: "trigger" | "action") {
    const colors = nodeType === "trigger" ? triggerColors : actionColors
    return colors[type] || (nodeType === "trigger" ? "bg-blue-500 border-blue-600" : "bg-orange-500 border-orange-600")
}
