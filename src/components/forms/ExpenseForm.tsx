import { useState, useEffect, useRef } from 'react'
import { CategorySelector } from './CategorySelector'
import { Button } from '../ui/Button'
import { useToast } from '../ui/Toast'
import type { ExpenseInput } from '../../types'

interface ExpenseFormProps {
  onSubmit: (data: ExpenseInput) => Promise<{ error: string | null }>
  onClose: () => void
  initialData?: Partial<ExpenseInput>
  submitLabel?: string
}

function todayISO(): string {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

export function ExpenseForm({
  onSubmit,
  onClose,
  initialData,
  submitLabel = 'Guardar gasto',
}: ExpenseFormProps) {
  const toast = useToast()
  const importeRef = useRef<HTMLInputElement>(null)

  const [importe, setImporte] = useState(initialData?.importe?.toString() ?? '')
  const [fecha, setFecha] = useState(initialData?.fecha ?? todayISO())
  const [categoria, setCategoria] = useState<string | null>(initialData?.categoria ?? null)
  const [subcategoria, setSubcategoria] = useState<string | null>(initialData?.subcategoria ?? null)
  const [detalle, setDetalle] = useState(initialData?.detalle ?? '')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    importeRef.current?.focus()
  }, [])

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    const imp = parseFloat(importe)
    if (!importe || isNaN(imp) || imp <= 0) errs.importe = 'Ingresá un importe válido'
    if (!fecha) errs.fecha = 'Seleccioná una fecha'
    if (!categoria) errs.categoria = 'Seleccioná una categoría'
    if (!subcategoria) errs.subcategoria = 'Seleccioná una subcategoría'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleCategoryChange = (cat: string) => {
    setCategoria(cat)
    setSubcategoria(null)
    setErrors((e) => ({ ...e, categoria: '', subcategoria: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    const result = await onSubmit({
      categoria: categoria!,
      subcategoria: subcategoria!,
      fecha,
      detalle: detalle.trim() || undefined,
      importe: parseFloat(importe),
    })
    setLoading(false)

    if (result.error) {
      toast('error', result.error.includes('unique') ? 'Ese gasto ya existe (duplicado).' : result.error)
      return
    }

    toast('success', 'Gasto guardado correctamente')
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Importe */}
      <div>
        <label className="block text-xs font-medium text-text2 dark:text-text2-dark mb-1.5">
          Importe
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-text2 dark:text-text2-dark">
            $
          </span>
          <input
            ref={importeRef}
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={importe}
            onChange={(e) => { setImporte(e.target.value); setErrors((er) => ({ ...er, importe: '' })) }}
            className={[
              'w-full pl-8 pr-4 py-3 text-2xl font-bold bg-surface-2 dark:bg-surface-2dark',
              'rounded-xl border-2 outline-none transition-all',
              'text-text1 dark:text-text1-dark placeholder:text-text2/40',
              errors.importe
                ? 'border-danger'
                : 'border-transparent focus:border-primary dark:focus:border-primary-dark',
            ].join(' ')}
          />
        </div>
        {errors.importe && (
          <p className="text-xs text-danger mt-1">{errors.importe}</p>
        )}
      </div>

      {/* Fecha */}
      <div>
        <label className="block text-xs font-medium text-text2 dark:text-text2-dark mb-1.5">
          Fecha
        </label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className={[
            'w-full px-3 py-2.5 bg-surface-2 dark:bg-surface-2dark rounded-xl border-2 outline-none transition-all',
            'text-text1 dark:text-text1-dark text-sm',
            errors.fecha
              ? 'border-danger'
              : 'border-transparent focus:border-primary dark:focus:border-primary-dark',
          ].join(' ')}
        />
        {errors.fecha && (
          <p className="text-xs text-danger mt-1">{errors.fecha}</p>
        )}
      </div>

      {/* Categoría + subcategoría */}
      <div>
        <label className="block text-xs font-medium text-text2 dark:text-text2-dark mb-1.5">
          Categoría
        </label>
        <CategorySelector
          selectedCategory={categoria}
          selectedSubcategory={subcategoria}
          onCategoryChange={handleCategoryChange}
          onSubcategoryChange={(sub) => { setSubcategoria(sub); setErrors((e) => ({ ...e, subcategoria: '' })) }}
        />
        {(errors.categoria || errors.subcategoria) && (
          <p className="text-xs text-danger mt-1.5">
            {errors.categoria || errors.subcategoria}
          </p>
        )}
      </div>

      {/* Detalle */}
      <div>
        <label className="block text-xs font-medium text-text2 dark:text-text2-dark mb-1.5">
          Detalle <span className="font-normal text-text2/60">(opcional)</span>
        </label>
        <textarea
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
          rows={2}
          placeholder="Ej: Supermercado Coto, AXA seguros..."
          className={[
            'w-full px-3 py-2.5 bg-surface-2 dark:bg-surface-2dark rounded-xl border-2 outline-none transition-all resize-none',
            'text-text1 dark:text-text1-dark text-sm placeholder:text-text2/40',
            'border-transparent focus:border-primary dark:focus:border-primary-dark',
          ].join(' ')}
        />
      </div>

      {/* Acciones */}
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
