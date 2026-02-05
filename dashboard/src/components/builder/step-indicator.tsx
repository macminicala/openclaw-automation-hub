import { cn } from "@/lib/utils"

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  stepNames: string[]
}

export function StepIndicator({ currentStep, totalSteps, stepNames }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div key={index} className="flex items-center">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors",
              index + 1 < currentStep
                ? "bg-primary text-primary-foreground"
                : index + 1 === currentStep
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {index + 1 < currentStep ? (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              index + 1
            )}
          </div>
          <span
            className={cn(
              "ml-2 mr-4 text-sm font-medium",
              index + 1 === currentStep
                ? "text-primary"
                : index + 1 < currentStep
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {stepNames[index]}
          </span>
          {index < totalSteps - 1 && (
            <div
              className={cn(
                "h-0.5 w-12 mr-4",
                index + 1 < currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}
