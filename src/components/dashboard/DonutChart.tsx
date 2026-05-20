import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { CATEGORY_COLORS, formatARS } from '../../lib/categoryData'
import { Card } from '../ui/Card'
import type { CategoryName } from '../../types'

interface DonutChartProps {
  data: Record<CategoryName, number>
  title?: string
}

interface ChartEntry {
  name: CategoryName
  value: number
  color: string
}

export function DonutChart({ data, title = 'Gasto por categoría' }: DonutChartProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryName | null>(null)

  const chartData: ChartEntry[] = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({
      name: name as CategoryName,
      value,
      color: CATEGORY_COLORS[name as CategoryName],
    }))
    .sort((a, b) => b.value - a.value)

  const total = chartData.reduce((s, d) => s + d.value, 0)
  const filtered = activeCategory
    ? chartData.filter((d) => d.name === activeCategory)
    : chartData

  if (chartData.length === 0) {
    return (
      <Card className="flex items-center justify-center h-64">
        <p className="text-text2-DEFAULT dark:text-text2-dark text-sm">Sin datos este mes</p>
      </Card>
    )
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text1-DEFAULT dark:text-text1-dark mb-4">{title}</h3>
      <div className="relative h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filtered}
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={84}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {filtered.map((entry) => (
                <Cell key={entry.name} fill={entry.color} opacity={activeCategory && activeCategory !== entry.name ? 0.3 : 1} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [formatARS(value), '']}
              contentStyle={{
                background: 'var(--tw-bg-surface)',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: '12px',
                fontSize: '13px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Texto central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-text2-DEFAULT dark:text-text2-dark">Total</span>
          <span className="text-base font-bold text-text1-DEFAULT dark:text-text1-dark">
            {formatARS(total)}
          </span>
        </div>
      </div>

      {/* Leyenda interactiva */}
      <div className="mt-4 grid grid-cols-2 gap-1.5">
        {chartData.map((entry) => (
          <button
            key={entry.name}
            onClick={() =>
              setActiveCategory((prev) => (prev === entry.name ? null : entry.name))
            }
            className={[
              'flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all',
              activeCategory === entry.name
                ? 'bg-surface-2 dark:bg-surface-2dark'
                : 'hover:bg-surface-2 dark:hover:bg-surface-2dark',
              activeCategory && activeCategory !== entry.name ? 'opacity-40' : '',
            ].join(' ')}
          >
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: entry.color }}
            />
            <span className="text-xs text-text1-DEFAULT dark:text-text1-dark truncate flex-1">
              {entry.name}
            </span>
            <span className="text-xs font-medium text-text2-DEFAULT dark:text-text2-dark flex-shrink-0">
              {total > 0 ? `${Math.round((entry.value / total) * 100)}%` : '0%'}
            </span>
          </button>
        ))}
      </div>
    </Card>
  )
}
