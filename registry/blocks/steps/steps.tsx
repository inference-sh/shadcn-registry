import * as React from "react"
import { cn } from "@/lib/utils"

interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

function Steps({ className, children, ...props }: StepsProps) {
  // Count Step children and inject step numbers
  let stepIndex = 0
  const childrenWithNumbers = React.Children.map(children, (child) => {
    if (
      React.isValidElement(child) &&
      (child.type as React.FC)?.displayName === "Step"
    ) {
      stepIndex++
      return React.cloneElement(child as React.ReactElement<StepInternalProps>, {
        _stepNumber: stepIndex,
      })
    }
    return child
  })

  return (
    <div className={cn("flex flex-col", className)} {...props}>
      {childrenWithNumbers}
    </div>
  )
}

interface StepInternalProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  _stepNumber?: number
}

function Step({ className, children, _stepNumber, ...props }: StepInternalProps) {
  return (
    <div className={cn("grid grid-cols-[auto_1fr] gap-4", className)} {...props}>
      {/* Left column: number + line */}
      <div className="flex flex-col items-center">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          {_stepNumber}
        </div>
        <div className="my-2 w-px flex-1 bg-border" />
      </div>
      {/* Right column: content */}
      <div>
        {children}
      </div>
    </div>
  )
}
Step.displayName = "Step"

interface StepTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

function StepTitle({ className, children, ...props }: StepTitleProps) {
  return (
    <h3
      className={cn("text-base font-medium leading-6 tracking-tight", className)}
      {...props}
    >
      {children}
    </h3>
  )
}

interface StepContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

function StepContent({ className, children, ...props }: StepContentProps) {
  return (
    <div className={cn("mt-2", className)} {...props}>
      {children}
    </div>
  )
}

export { Steps, Step, StepTitle, StepContent }
