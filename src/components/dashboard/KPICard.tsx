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
        <span className="text-xs font-medium uppercase tracking-wide text-text2-DEFAULT dark:text-text2-dark">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-primary-DEFAULT/10 dark:bg-primary-dark/10">
          <Icon size={16} className="text-primary-DEFAULT dark:text-primary-dark" />
        </div>
      </div>

      <div>
        <p className="text-2xl font-bold text-text1-DEFAULT dark:text-text1-dark leading-none">
          {value}
        </p>
        <p className="text-xs text-text2-DEFAULT dark:text-text2-dark mt-1">{subtitle}</p>
      </div>

      <div className="flex items-center gap-1">
        {trendPositive ? (
          <TrendingDown size={13} className="text-teal-DEFAULT" />
        ) : (
          <TrendingUp size={13} className="text-danger-DEFAULT" />
        )}
        <span
          className={[
            'text-xs font-semibold',
            trendPositive ? 'text-teal-DEFAULT' : 'text-danger-DEFAULT',
          ].join(' ')}
        >
          {trend}
        </span>
        <span className="text-xs text-text2-DEFAULT dark:text-text2-dark">vs mes anterior</span>
      </div>
    </Card>
  )
}
