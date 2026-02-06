"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Header } from "@/components/header"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { ArrowLeft, Bot, Bell, Settings, Eye, EyeOff, Save, Key, Cpu, Volume2 } from "lucide-react"
import Link from "next/link"

interface SettingsState {
    // AI Configuration
    claudeApiKey: string
    claudeModel: string
    systemPrompt: string
    maxTokens: number

    // Notifications
    enableDesktopNotifications: boolean
    enableSoundNotifications: boolean
    notifyOnSuccess: boolean
    notifyOnError: boolean

    // General
    autoRefreshInterval: number
    darkMode: boolean
    language: string
}

const defaultSettings: SettingsState = {
    claudeApiKey: "",
    claudeModel: "claude-sonnet-4-20250514",
    systemPrompt: "Sei un assistente AI proattivo che aiuta l'utente a gestire le sue automazioni.",
    maxTokens: 4096,
    enableDesktopNotifications: true,
    enableSoundNotifications: false,
    notifyOnSuccess: true,
    notifyOnError: true,
    autoRefreshInterval: 30,
    darkMode: false,
    language: "it",
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<SettingsState>(defaultSettings)
    const [showApiKey, setShowApiKey] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        // Load settings from localStorage
        const saved = localStorage.getItem("automation-hub-settings")
        if (saved) {
            try {
                setSettings({ ...defaultSettings, ...JSON.parse(saved) })
            } catch (e) {
                console.error("Error loading settings:", e)
            }
        }
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            localStorage.setItem("automation-hub-settings", JSON.stringify(settings))
            toast.success("Impostazioni salvate!")
        } catch (error) {
            toast.error("Errore nel salvataggio delle impostazioni")
        } finally {
            setSaving(false)
        }
    }

    const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-6 py-8">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold">Impostazioni</h1>
                        <p className="text-muted-foreground">Configura l'Automation Hub</p>
                    </div>
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? "Salvataggio..." : "Salva"}
                    </Button>
                </div>

                <Tabs defaultValue="ai" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                        <TabsTrigger value="ai" className="flex items-center gap-2">
                            <Bot className="h-4 w-4" />
                            AI
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            Notifiche
                        </TabsTrigger>
                        <TabsTrigger value="general" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Generali
                        </TabsTrigger>
                    </TabsList>

                    {/* AI Configuration */}
                    <TabsContent value="ai" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Key className="h-5 w-5" />
                                    Configurazione API
                                </CardTitle>
                                <CardDescription>
                                    Configura le credenziali per l'assistente AI
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="claudeApiKey">Claude API Key</Label>
                                    <div className="relative">
                                        <Input
                                            id="claudeApiKey"
                                            type={showApiKey ? "text" : "password"}
                                            placeholder="sk-ant-..."
                                            value={settings.claudeApiKey}
                                            onChange={(e) => updateSetting("claudeApiKey", e.target.value)}
                                            className="pr-10"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3"
                                            onClick={() => setShowApiKey(!showApiKey)}
                                        >
                                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Ottieni la tua API key da{" "}
                                        <a
                                            href="https://console.anthropic.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                        >
                                            console.anthropic.com
                                        </a>
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="claudeModel">Modello</Label>
                                    <Select
                                        value={settings.claudeModel}
                                        onValueChange={(v) => updateSetting("claudeModel", v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="claude-sonnet-4-20250514">Claude Sonnet 4 (Consigliato)</SelectItem>
                                            <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
                                            <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku (Veloce)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="maxTokens">Max Tokens</Label>
                                    <Input
                                        id="maxTokens"
                                        type="number"
                                        value={settings.maxTokens}
                                        onChange={(e) => updateSetting("maxTokens", parseInt(e.target.value) || 4096)}
                                        min={256}
                                        max={100000}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Cpu className="h-5 w-5" />
                                    Comportamento AI
                                </CardTitle>
                                <CardDescription>
                                    Personalizza come l'assistente AI si comporta
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="systemPrompt">System Prompt</Label>
                                    <Textarea
                                        id="systemPrompt"
                                        value={settings.systemPrompt}
                                        onChange={(e) => updateSetting("systemPrompt", e.target.value)}
                                        rows={4}
                                        placeholder="Descrivi come vuoi che l'AI si comporti..."
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Questo prompt verrà usato come contesto iniziale per l'AI
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notifications */}
                    <TabsContent value="notifications" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    Preferenze Notifiche
                                </CardTitle>
                                <CardDescription>
                                    Configura come ricevere notifiche sulle automazioni
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Notifiche Desktop</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Mostra notifiche del browser
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.enableDesktopNotifications}
                                        onCheckedChange={(v) => updateSetting("enableDesktopNotifications", v)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="flex items-center gap-2">
                                            <Volume2 className="h-4 w-4" />
                                            Suoni
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Riproduci suoni per eventi
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.enableSoundNotifications}
                                        onCheckedChange={(v) => updateSetting("enableSoundNotifications", v)}
                                    />
                                </div>

                                <div className="border-t pt-4 space-y-4">
                                    <p className="text-sm font-medium">Notifica quando:</p>

                                    <div className="flex items-center justify-between">
                                        <Label>Esecuzione completata con successo</Label>
                                        <Switch
                                            checked={settings.notifyOnSuccess}
                                            onCheckedChange={(v) => updateSetting("notifyOnSuccess", v)}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Label>Esecuzione fallita</Label>
                                        <Switch
                                            checked={settings.notifyOnError}
                                            onCheckedChange={(v) => updateSetting("notifyOnError", v)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* General */}
                    <TabsContent value="general" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    Impostazioni Generali
                                </CardTitle>
                                <CardDescription>
                                    Preferenze generali dell'applicazione
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="autoRefresh">Auto-refresh (secondi)</Label>
                                    <Input
                                        id="autoRefresh"
                                        type="number"
                                        value={settings.autoRefreshInterval}
                                        onChange={(e) => updateSetting("autoRefreshInterval", parseInt(e.target.value) || 30)}
                                        min={5}
                                        max={300}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Intervallo per aggiornare automaticamente i dati
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="language">Lingua</Label>
                                    <Select
                                        value={settings.language}
                                        onValueChange={(v) => updateSetting("language", v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="it">🇮🇹 Italiano</SelectItem>
                                            <SelectItem value="en">🇬🇧 English</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Tema Scuro</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Attiva il tema scuro (dark mode)
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.darkMode}
                                        onCheckedChange={(v) => updateSetting("darkMode", v)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            <Toaster position="bottom-right" />
        </div>
    )
}
