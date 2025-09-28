import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type InputProps = InputHTMLAttributes<HTMLInputElement>

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-2xl border border-stroke bg-white/90 px-4 py-3 text-base text-brand-navy shadow-sm transition focus:border-brand-turquoise focus:ring-brand-turquoise disabled:cursor-not-allowed disabled:opacity-70',
        className
      )}
      {...props}
    />
  )
})

Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'min-h-[120px] w-full rounded-2xl border border-stroke bg-white/90 px-4 py-3 text-base text-brand-navy shadow-sm transition focus:border-brand-turquoise focus:ring-brand-turquoise disabled:cursor-not-allowed disabled:opacity-70',
        className
      )}
      {...props}
    />
  )
})

Textarea.displayName = 'Textarea'
