"use client"

import { cn } from '@/lib/utils'

type Step = {
  title: string
  description?: string
}

export function FormStepper({ steps, current }: { steps: Step[]; current: number }) {
  return (
    <ol className="flex items-center justify-between gap-2">
      {steps.map((step, index) => {
        const isActive = index === current
        const isComplete = index < current
        return (
          <li key={step.title} className="flex flex-1 items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold',
                isComplete && 'border-brand-turquoise bg-brand-turquoise text-white',
                isActive && 'border-brand-orange bg-brand-orange text-white',
                !isActive && !isComplete && 'border-brand-navy/20 text-brand-navy/60'
              )}
            >
              {index + 1}
            </div>
            <div>
              <p className={cn('text-sm font-semibold', isActive ? 'text-brand-navy' : 'text-brand-navy/60')}>
                {step.title}
              </p>
              {step.description ? (
                <p className="text-xs text-brand-navy/50">{step.description}</p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
