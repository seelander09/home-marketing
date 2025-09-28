import { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

type BadgeProps = PropsWithChildren<{
  color?: 'turquoise' | 'orange' | 'navy'
  className?: string
}>

const colorMap: Record<Required<BadgeProps>['color'], string> = {
  turquoise: 'bg-brand-turquoise/15 text-brand-turquoise',
  orange: 'bg-brand-orange/15 text-brand-orange',
  navy: 'bg-brand-navy/10 text-brand-navy'
}

export function Badge({ color = 'turquoise', className, children }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold uppercase tracking-wide', colorMap[color], className)}>
      {children}
    </span>
  )
}
