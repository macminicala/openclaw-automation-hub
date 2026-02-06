"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"

interface AutomationFiltersProps {
    searchQuery: string
    onSearchChange: (query: string) => void
    triggerFilter: string
    onTriggerFilterChange: (filter: string) => void
    statusFilter: string
    onStatusFilterChange: (filter: string) => void
}

const triggerOptions = [
    { value: "all", label: "Tutti i trigger" },
    { value: "schedule", label: "⏰ Schedule" },
    { value: "webhook", label: "🔗 Webhook" },
    { value: "file_change", label: "📁 File Change" },
    { value: "email", label: "📧 Email" },
    { value: "calendar", label: "📅 Calendario" },
    { value: "system", label: "💻 Sistema" },
]

const statusOptions = [
    { value: "all", label: "Tutti gli stati" },
    { value: "active", label: "🟢 Attive" },
    { value: "inactive", label: "⚪ Disattivate" },
]

export function AutomationFilters({
    searchQuery,
    onSearchChange,
    triggerFilter,
    onTriggerFilterChange,
    statusFilter,
    onStatusFilterChange,
}: AutomationFiltersProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Cerca automazione..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10"
                />
            </div>

            <Select value={triggerFilter} onValueChange={onTriggerFilterChange}>
                <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Trigger" />
                </SelectTrigger>
                <SelectContent>
                    {triggerOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="Stato" />
                </SelectTrigger>
                <SelectContent>
                    {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
