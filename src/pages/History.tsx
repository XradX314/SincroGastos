import { useState, useMemo } from 'react'
import { Search, Filter, ChevronLeft, ChevronRight, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { useExpenses } from '../hooks/useExpenses'
import { CATEGORY_NAMES, CATEGORIES, formatARS } from '../lib/categoryData'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { ExpenseForm } from '../components/forms/ExpenseForm'
import { useToast } from '../components/ui/Toast'
import type { CategoryName, Expense, ExpenseInput } from '../types'

const PAGE_SIZE = 20

const MONTHS = [
  { value: '', label: 'Todos los meses' },
  { value: '1', label: 'Enero' }, { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' }, { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' }, { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' }, { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' }, { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' },
]

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function History() {
  const { expenses, loading, updateExpense, deleteExpense } = useExpenses()
  const toast = useToast()

  const [search, setSearch] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterCat, setFilterCat] = useState<CategoryName | ''>('')
  const [filterSub, setFilterSub] = useState('')
  const [page, setPage] = useState(1)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (filterMonth) {
        const m = new Date(e.fecha + 'T00:00:00').getMonth() + 1
        if (String(m) !== filterMonth) return false
      }
      if (filterCat && e.categoria !== filterCat) return false
      if (filterSub && e.subcategoria !== filterSub) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !e.categoria.toLowerCase().includes(q) &&
          !e.subcategoria.toLowerCase().includes(q) &&
          !(e.detalle ?? '').toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [expenses, filterMonth, filterCat, filterSub, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const subcategories = filterCat ? CATEGORIES[filterCat] : []

  const handleUpdate = async (data: ExpenseInput) => {
    if (!editExpense) return { error: 'Sin gasto seleccionado' }
    const result = await updateExpense(editExpense.id, data)
    if (!result.error) {
      toast('success', 'Gasto actualizado')
      setEditExpense(null)
    }
    return result
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const result = await deleteExpense(id)
    setDeletingId(null)
    setConfirmDelete(null)
    if (result.error) {
      toast('error', 'Error al eliminar')
    } else {
      toast('success', 'Gasto eliminado')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <Filter size={20} className="text-primary dark:text-primary-dark" />
        <h1 className="text-xl font-bold text-text1 dark:text-text1-dark">Historial</h1>
      </div>

      {/* Filtros */}
      <Card padding="sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Buscador */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text2 dark:text-text2-dark" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-8 pr-3 py-2 text-sm rounded-xl bg-surface-2 dark:bg-surface-2dark border-2 border-transparent focus:border-primary dark:focus:border-primary-dark outline-none transition-all text-text1 dark:text-text1-dark"
            />
          </div>

          {/* Mes */}
          <select
            value={filterMonth}
            onChange={(e) => { setFilterMonth(e.target.value); setPage(1) }}
            className="py-2 px-3 text-sm rounded-xl bg-surface-2 dark:bg-surface-2dark border-2 border-transparent focus:border-primary dark:focus:border-primary-dark outline-none transition-all text-text1 dark:text-text1-dark"
          >
            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>

          {/* Categoría */}
          <select
            value={filterCat}
            onChange={(e) => { setFilterCat(e.target.value as CategoryName | ''); setFilterSub(''); setPage(1) }}
            className="py-2 px-3 text-sm rounded-xl bg-surface-2 dark:bg-surface-2dark border-2 border-transparent focus:border-primary dark:focus:border-primary-dark outline-none transition-all text-text1 dark:text-text1-dark"
          >
            <option value="">Todas las categorías</option>
            {CATEGORY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Subcategoría */}
          <select
            value={filterSub}
            disabled={!filterCat}
            onChange={(e) => { setFilterSub(e.target.value); setPage(1) }}
            className="py-2 px-3 text-sm rounded-xl bg-surface-2 dark:bg-surface-2dark border-2 border-transparent focus:border-primary dark:focus:border-primary-dark outline-none transition-all text-text1 dark:text-text1-dark disabled:opacity-50"
          >
            <option value="">Todas las subcategorías</option>
            {subcategories.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </Card>

      {/* Resultados */}
      <div className="flex items-center justify-between text-xs text-text2 dark:text-text2-dark px-1">
        <span>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
        {filtered.length > 0 && (
          <span>Pág. {page} de {totalPages}</span>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <Card className="flex items-center justify-center h-32">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="flex items-center justify-center h-32">
          <p className="text-sm text-text2 dark:text-text2-dark">Sin resultados</p>
        </Card>
      ) : (
        <Card padding="none">
          <ul>
            {paginated.map((expense, idx) => {
              const isLast = idx === paginated.length - 1
              return (
                <li
                  key={expense.id}
                  className={[
                    'px-4 py-3 flex items-center gap-3 group hover:bg-surface-2 dark:hover:bg-surface-2dark transition-colors',
                    !isLast ? 'border-b border-black/[0.04] dark:border-white/[0.04]' : '',
                  ].join(' ')}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-text1 dark:text-text1-dark truncate">
                        {expense.categoria} · {expense.subcategoria}
                      </span>
                      {expense.origen === 'excel' && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex-shrink-0">
                          Excel
                        </span>
                      )}
                    </div>
                    {expense.detalle && (
                      <p className="text-xs text-text2 dark:text-text2-dark truncate">{expense.detalle}</p>
                    )}
                    <p className="text-[11px] text-text2 dark:text-text2-dark mt-0.5">{formatDateFull(expense.fecha)}</p>
                  </div>

                  <span className="text-sm font-semibold text-text1 dark:text-text1-dark flex-shrink-0">
                    {formatARS(expense.importe)}
                  </span>

                  {/* Acciones */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => setEditExpense(expense)}
                      className="p-1.5 rounded-lg text-text2 dark:text-text2-dark hover:bg-surface dark:hover:bg-surface-dark transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    {confirmDelete === expense.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(expense.id)}
                          disabled={deletingId === expense.id}
                          className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-danger text-white text-[10px] font-medium"
                        >
                          <AlertTriangle size={10} />
                          {deletingId === expense.id ? '...' : 'Sí'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-1.5 py-1 rounded-lg text-[10px] text-text2 dark:text-text2-dark hover:bg-surface dark:hover:bg-surface-dark"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(expense.id)}
                        className="p-1.5 rounded-lg text-text2 dark:text-text2-dark hover:bg-surface dark:hover:bg-surface-dark transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft size={14} />
          </Button>
          <span className="text-sm text-text2 dark:text-text2-dark px-2">
            {page} / {totalPages}
          </span>
          <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight size={14} />
          </Button>
        </div>
      )}

      {/* Modal de edición */}
      <Modal open={!!editExpense} onClose={() => setEditExpense(null)} title="Editar gasto">
        {editExpense && (
          <ExpenseForm
            onSubmit={handleUpdate}
            onClose={() => setEditExpense(null)}
            initialData={{
              categoria: editExpense.categoria,
              subcategoria: editExpense.subcategoria,
              fecha: editExpense.fecha,
              detalle: editExpense.detalle ?? undefined,
              importe: editExpense.importe,
            }}
            submitLabel="Guardar cambios"
          />
        )}
      </Modal>
    </div>
  )
}
