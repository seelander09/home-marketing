import { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

type CardProps = PropsWithChildren<{
  className?: string
  as?: 'section' | 'article' | 'div'
}>

export function Card({ as: Component = 'article', className, children }: CardProps) {
  return (
    <Component className={cn('rounded-3xl border border-white/10 bg-white/80 p-6 shadow-card backdrop-blur-sm', className)}>
      {children}
    </Component>
  )
}
