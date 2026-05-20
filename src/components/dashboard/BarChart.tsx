import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatARSCompact, formatARS } from '../../lib/categoryData'
import { Card } from '../ui/Card'

interface MonthBarData {
  label: string
  total: number
  isCurrent: boolean
}

interface BarChartProps {
  data: MonthBarData[]
  title?: string
}

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function buildLast6MonthsData(
  getMonthExpenses: (year: number, month: number) => { importe: number }[],
): MonthBarData[] {
  const now = new Date()
  const result: MonthBarData[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const expenses = getMonthExpenses(year, month)
    const total = expenses.reduce((s, e) => s + e.importe, 0)
    result.push({
      label: MONTH_LABELS[month - 1],
      total,
      isCurrent: i === 0,
    })
  }
  return result
}

export function BarChart({ data, title = 'Últimos 6 meses' }: BarChartProps) {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-text1 dark:text-text1-dark mb-4">{title}</h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} barSize={32} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: 'currentColor' }}
              className="text-text2 dark:text-text2-dark"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatARSCompact}
              tick={{ fontSize: 11, fill: 'currentColor' }}
              className="text-text2 dark:text-text2-dark"
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip
              formatter={(value: number) => [formatARS(value), 'Total']}
              contentStyle={{
                background: 'white',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: '12px',
                fontSize: '13px',
              }}
              cursor={{ fill: 'rgba(79,106,245,0.06)' }}
            />
            <Bar dataKey="total" radius={[6, 6, 0, 0]}>
              {data.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.isCurrent ? '#4F6AF5' : '#CBD5FF'}
                />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
