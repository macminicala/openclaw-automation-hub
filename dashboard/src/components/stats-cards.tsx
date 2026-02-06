"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Zap, CheckCircle, XCircle, Clock } from "lucide-react"

interface StatsCardsProps {
    total: number
    active: number
    failed: number
    lastRun?: string
}

export function StatsCards({ total, active, failed, lastRun }: StatsCardsProps) {
    const cards = [
        {
            label: "Totale Automazioni",
            value: total,
            icon: Zap,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
        },
        {
            label: "Attive",
            value: active,
            icon: CheckCircle,
            color: "text-green-500",
            bgColor: "bg-green-500/10",
        },
        {
            label: "Disattivate",
            value: total - active,
            icon: XCircle,
            color: "text-gray-500",
            bgColor: "bg-gray-500/10",
        },
        {
            label: "Errori",
            value: failed,
            icon: XCircle,
            color: "text-red-500",
            bgColor: "bg-red-500/10",
        },
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {cards.map((card) => (
                <Card key={card.label} className="overflow-hidden">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${card.bgColor}`}>
                                <card.icon className={`h-5 w-5 ${card.color}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{card.value}</p>
                                <p className="text-xs text-muted-foreground">{card.label}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
