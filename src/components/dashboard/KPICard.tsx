import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react'
import { Card } from '../ui/Card'

interface KPICardProps {
  title: string
  value: string
  subtitle: string
  trend: string
  trendPositive: boolean
  icon: LucideIcon
}

export function KPICard({ title, value, subtitle, trend, trendPositive, icon: Icon }: KPICardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-text2 dark:text-text2-dark">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary-dark/10">
          <Icon size={16} className="text-primary dark:text-primary-dark" />
        </div>
      </div>

      <div>
        <p className="text-2xl font-bold text-text1 dark:text-text1-dark leading-none">
          {value}
        </p>
        <p className="text-xs text-text2 dark:text-text2-dark mt-1">{subtitle}</p>
      </div>

      <div className="flex items-center gap-1">
        {trendPositive ? (
          <TrendingDown size={13} className="text-teal" />
        ) : (
          <TrendingUp size={13} className="text-danger" />
        )}
        <span
          className={[
            'text-xs font-semibold',
            trendPositive ? 'text-teal' : 'text-danger',
          ].join(' ')}
        >
          {trend}
        </span>
        <span className="text-xs text-text2 dark:text-text2-dark">vs mes anterior</span>
      </div>
    </Card>
  )
}
