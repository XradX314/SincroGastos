import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary-DEFAULT hover:bg-primary-hover text-white dark:bg-primary-dark dark:hover:bg-primary-DEFAULT',
  secondary:
    'bg-surface-2 hover:bg-surface-DEFAULT text-text1-DEFAULT dark:bg-surface-2dark dark:hover:bg-surface-dark dark:text-text1-dark border border-black/10 dark:border-white/10',
  danger:
    'bg-danger-DEFAULT hover:bg-red-700 text-white',
  ghost:
    'bg-transparent hover:bg-surface-2 text-text1-DEFAULT dark:hover:bg-surface-2dark dark:text-text1-dark',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      className={[
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-DEFAULT/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      disabled={isDisabled}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}
