import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  fullWidth?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brand-turquoise text-white hover:bg-brand-orange shadow-lg shadow-brand-navy/10',
  secondary: 'bg-white text-brand-navy border border-brand-turquoise hover:text-brand-turquoise hover:border-brand-orange',
  ghost: 'bg-transparent text-white hover:text-brand-orange',
  outline: 'border border-white/60 text-white hover:border-brand-orange hover:text-brand-orange'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', fullWidth, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'btn focus-ring transition-transform hover:-translate-y-0.5 active:translate-y-0',
          variantStyles[variant],
          fullWidth ? 'w-full' : undefined,
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
