"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock } from "lucide-react"
import { SCHEDULE_FREQUENCIES, DAYS_OF_WEEK, DAYS_OF_MONTH } from "@/lib/constants/automation-config"

interface ScheduleConfigProps {
    scheduleFreq: string
    setScheduleFreq: (value: string) => void
    scheduleTime: string
    setScheduleTime: (value: string) => void
    scheduleDayOfWeek: string
    setScheduleDayOfWeek: (value: string) => void
    scheduleDayOfMonth: string
    setScheduleDayOfMonth: (value: string) => void
    onSave: () => void
}

export function ScheduleConfig({
    scheduleFreq,
    setScheduleFreq,
    scheduleTime,
    setScheduleTime,
    scheduleDayOfWeek,
    setScheduleDayOfWeek,
    scheduleDayOfMonth,
    setScheduleDayOfMonth,
    onSave,
}: ScheduleConfigProps) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Pianificazione
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label>Frequenza <span className="text-red-500">*</span></Label>
                    <Select value={scheduleFreq} onValueChange={setScheduleFreq}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {SCHEDULE_FREQUENCIES.map((freq) => (
                                <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {scheduleFreq === "daily" && (
                    <div className="grid gap-2">
                        <Label>Orario</Label>
                        <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                    </div>
                )}

                {scheduleFreq === "weekly" && (
                    <div className="grid gap-2">
                        <Label>Giorno</Label>
                        <Select value={scheduleDayOfWeek} onValueChange={setScheduleDayOfWeek}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {DAYS_OF_WEEK.map((day) => (
                                    <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                    </div>
                )}

                {scheduleFreq === "monthly" && (
                    <div className="grid gap-2">
                        <Label>Giorno del mese</Label>
                        <Select value={scheduleDayOfMonth} onValueChange={setScheduleDayOfMonth}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {DAYS_OF_MONTH.map((day) => (
                                    <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                    </div>
                )}

                {(scheduleFreq === "hourly" || scheduleFreq === "minutely") && (
                    <p className="text-sm text-muted-foreground">
                        {scheduleFreq === "hourly" ? "All'inizio di ogni ora" : "Ogni minuto"}
                    </p>
                )}

                <Button onClick={onSave} className="w-full">Salva</Button>
            </CardContent>
        </Card>
    )
}
