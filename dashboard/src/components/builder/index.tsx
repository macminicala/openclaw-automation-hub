"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { TriggerStep, type TriggerConfig } from "./trigger-step"
import { ActionStep, type ActionConfig } from "./action-step"
import { ReviewStep } from "./review-step"
import { StepIndicator } from "./step-indicator"

interface AutomationBuilderProps {
  automation?: {
    id: string
    name: string
    trigger: string
    action: string
    enabled: boolean
    config: Record<string, string>
  }
  onClose: () => void
  onSave: (data: {
    name: string
    trigger: string
    action: string
    enabled: boolean
    config: Record<string, string>
  }) => void
}

export function AutomationBuilder({ automation, onClose, onSave }: AutomationBuilderProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState(automation?.name || "")
  const [trigger, setTrigger] = useState(automation?.trigger || "")
  const [action, setAction] = useState(automation?.action || "")
  const [triggerConfig, setTriggerConfig] = useState<Record<string, string>>({})
  const [actionConfig, setActionConfig] = useState<Record<string, string>>(
    automation?.config || {}
  )
  const [isLoading, setIsLoading] = useState(false)

  const stepNames = ["Trigger", "Azione", "Riepilogo"]

  const triggerLabels: Record<string, string> = {
    schedule: "Schedule",
    webhook: "HTTP Request",
    file_change: "Monitora File",
    email: "Email",
    calendar: "Calendario",
    system: "Sistema",
  }

  const actionLabels: Record<string, string> = {
    shell: "Esegui Comando Terminale",
    ai_agent: "Assistente AI",
    git: "Git (auto-commit)",
    notify: "Notifica",
    email: "Email",
  }

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      onSave({
        name,
        trigger,
        action,
        enabled: automation?.enabled ?? true,
        config: actionConfig,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {automation ? "Modifica Automazione" : "Nuova Automazione"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          <StepIndicator currentStep={step} totalSteps={3} stepNames={stepNames} />

          {step === 1 && (
            <TriggerStep
              selectedTrigger={trigger}
              onSelect={setTrigger}
            />
          )}

          {step === 2 && (
            <ActionStep
              selectedAction={action}
              actionConfig={actionConfig}
              onSelect={setAction}
              onConfigChange={(key, value) =>
                setActionConfig((prev) => ({ ...prev, [key]: value }))
              }
            />
          )}

          {step === 3 && (
            <ReviewStep
              name={name}
              trigger={trigger}
              triggerLabel={triggerLabels[trigger] || trigger}
              action={action}
              actionLabel={actionLabels[action] || action}
              actionConfig={actionConfig}
              onNameChange={setName}
              onSave={handleSave}
              onBack={handleBack}
              isLoading={isLoading}
            />
          )}

          {step < 3 && (
            <div className="flex justify-center gap-4 mt-8">
              {step > 1 && (
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Indietro
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={(step === 1 && !trigger) || (step === 2 && !action)}
              >
                Avanti
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
