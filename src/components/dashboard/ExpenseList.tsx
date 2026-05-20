import { useState } from 'react'
import {
  Home, User, Users, HelpCircle, Trash2,
  AlertTriangle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { formatARS } from '../../lib/categoryData'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import type { CategoryName, Expense } from '../../types'

const CATEGORY_ICONS: Record<CategoryName, LucideIcon> = {
  'Casa':   Home,
  'Hijo 1': Users,
  'Hijo 2': Users,
  'Hijo 3': Users,
  'Yo':     User,
  'Otros':  HelpCircle,
}

const CATEGORY_COLORS: Record<CategoryName, string> = {
  'Casa':   'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  'Hijo 1': 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Hijo 2': 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  'Hijo 3': 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  'Yo':     'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  'Otros':  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${d.getDate()} ${months[d.getMonth()]}`
}

interface ExpenseListProps {
  expenses: Expense[]
  onDelete: (id: string) => Promise<void>
  loading?: boolean
}

export function ExpenseList({ expenses, onDelete, loading }: ExpenseListProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const recent = expenses.slice(0, 10)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await onDelete(id)
    setDeletingId(null)
    setConfirmId(null)
  }

  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.06]">
        <h3 className="text-sm font-semibold text-text1-DEFAULT dark:text-text1-dark">
          Últimos gastos
        </h3>
        <span className="text-xs text-text2-DEFAULT dark:text-text2-dark">
          {expenses.length} en total
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 border-2 border-primary-DEFAULT border-t-transparent rounded-full animate-spin" />
        </div>
      ) : recent.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 gap-2">
          <p className="text-sm text-text2-DEFAULT dark:text-text2-dark">Sin gastos registrados</p>
        </div>
      ) : (
        <ul>
          {recent.map((expense, idx) => {
            const Icon = CATEGORY_ICONS[expense.categoria]
            const iconClass = CATEGORY_COLORS[expense.categoria]
            const isLast = idx === recent.length - 1

            return (
              <li
                key={expense.id}
                className={[
                  'px-5 py-3 flex items-center gap-3 group hover:bg-surface-2 dark:hover:bg-surface-2dark transition-colors',
                  !isLast ? 'border-b border-black/[0.04] dark:border-white/[0.04]' : '',
                ].join(' ')}
              >
                {/* Ícono */}
                <div className={`p-2 rounded-lg flex-shrink-0 ${iconClass}`}>
                  <Icon size={14} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text1-DEFAULT dark:text-text1-dark truncate">
                      {expense.subcategoria}
                    </span>
                    {expense.origen === 'excel' && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex-shrink-0">
                        Excel
                      </span>
                    )}
                  </div>
                  {expense.detalle && (
                    <p className="text-xs text-text2-DEFAULT dark:text-text2-dark truncate">
                      {expense.detalle}
                    </p>
                  )}
                </div>

                {/* Fecha + importe */}
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span className="text-sm font-semibold text-text1-DEFAULT dark:text-text1-dark">
                    {formatARS(expense.importe)}
                  </span>
                  <span className="text-[11px] text-text2-DEFAULT dark:text-text2-dark">
                    {formatDate(expense.fecha)}
                  </span>
                </div>

                {/* Eliminar */}
                {confirmId === expense.id ? (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleDelete(expense.id)}
                      disabled={deletingId === expense.id}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-danger-DEFAULT text-white text-xs font-medium disabled:opacity-50"
                    >
                      <AlertTriangle size={11} />
                      {deletingId === expense.id ? '...' : 'Sí'}
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="px-2 py-1 rounded-lg text-xs text-text2-DEFAULT dark:text-text2-dark hover:bg-surface-2 dark:hover:bg-surface-2dark"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmId(expense.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 !p-1.5"
                    aria-label="Eliminar gasto"
                  >
                    <Trash2 size={14} className="text-text2-DEFAULT dark:text-text2-dark" />
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
