import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  onClick?: () => void
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4 md:p-5',
  lg: 'p-6',
}

export function Card({ children, className = '', padding = 'md', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={[
        'bg-surface dark:bg-surface-dark rounded-2xl shadow-card dark:shadow-card-dark',
        'border border-black/[0.06] dark:border-white/[0.06]',
        paddingClasses[padding],
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
