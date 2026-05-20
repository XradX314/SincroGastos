import { useState } from 'react'
import { Plus, Trash2, Check, X, Settings2, Pencil } from 'lucide-react'
import { useCategories, type CategoryRow } from '../contexts/CategoriesContext'
import { useToast } from '../components/ui/Toast'
import { Card } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'

const COLOR_PALETTE = [
  '#4F6AF5', '#0EA882', '#F59E0B', '#EC4899',
  '#8B5CF6', '#EF4444', '#F97316', '#10B981',
  '#06B6D4', '#6B7280', '#84CC16', '#E11D48',
]

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {COLOR_PALETTE.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className="w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center"
          style={{ background: c, borderColor: value === c ? '#fff' : c }}
        >
          {value === c && <Check size={12} className="text-white" strokeWidth={3} />}
        </button>
      ))}
    </div>
  )
}

interface SubcategoryChipsProps {
  cat: CategoryRow
  onUpdate: (id: string, updates: Partial<Omit<CategoryRow, 'id'>>) => Promise<{ error: string | null }>
}

function SubcategoryChips({ cat, onUpdate }: SubcategoryChipsProps) {
  const toast = useToast()
  const [newSub, setNewSub] = useState('')
  const [adding, setAdding] = useState(false)

  const removeSubcategory = async (sub: string) => {
    const next = cat.subcategorias.filter((s) => s !== sub)
    const { error } = await onUpdate(cat.id, { subcategorias: next })
    if (error) toast('error', error)
  }

  const addSubcategory = async () => {
    const trimmed = newSub.trim()
    if (!trimmed || cat.subcategorias.includes(trimmed)) return
    const next = [...cat.subcategorias, trimmed]
    const { error } = await onUpdate(cat.id, { subcategorias: next })
    if (error) { toast('error', error); return }
    setNewSub('')
    setAdding(false)
  }

  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-text2 dark:text-text2-dark mb-2">Subcategorías</p>
      <div className="flex flex-wrap gap-1.5">
        {cat.subcategorias.map((sub) => (
          <span
            key={sub}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-2 dark:bg-surface-2dark text-text1 dark:text-text1-dark"
          >
            {sub}
            <button
              onClick={() => removeSubcategory(sub)}
              className="text-text2 dark:text-text2-dark hover:text-danger transition-colors ml-0.5"
            >
              <X size={11} strokeWidth={2.5} />
            </button>
          </span>
        ))}

        {adding ? (
          <span className="flex items-center gap-1">
            <input
              autoFocus
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubcategory() } if (e.key === 'Escape') { setAdding(false); setNewSub('') } }}
              placeholder="Nueva subcategoría"
              className="px-2 py-1 text-xs rounded-full border-2 border-primary dark:border-primary-dark bg-surface dark:bg-surface-dark text-text1 dark:text-text1-dark outline-none w-36"
            />
            <button onClick={addSubcategory} className="p-1 rounded-full text-teal hover:bg-teal/10 transition-colors">
              <Check size={13} strokeWidth={2.5} />
            </button>
            <button onClick={() => { setAdding(false); setNewSub('') }} className="p-1 rounded-full text-text2 hover:bg-surface-2 dark:hover:bg-surface-2dark transition-colors">
              <X size={13} strokeWidth={2.5} />
            </button>
          </span>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border-2 border-dashed border-black/20 dark:border-white/20 text-text2 dark:text-text2-dark hover:border-primary dark:hover:border-primary-dark hover:text-primary dark:hover:text-primary-dark transition-all"
          >
            <Plus size={11} /> Agregar
          </button>
        )}
      </div>
    </div>
  )
}

interface EditCategoryModalProps {
  cat: CategoryRow
  open: boolean
  onClose: () => void
  onUpdate: (id: string, updates: Partial<Omit<CategoryRow, 'id'>>) => Promise<{ error: string | null }>
}

function EditCategoryModal({ cat, open, onClose, onUpdate }: EditCategoryModalProps) {
  const toast = useToast()
  const [nombre, setNombre] = useState(cat.nombre)
  const [color, setColor] = useState(cat.color)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!nombre.trim()) return
    setSaving(true)
    const { error } = await onUpdate(cat.id, { nombre: nombre.trim(), color })
    setSaving(false)
    if (error) { toast('error', error); return }
    toast('success', 'Categoría actualizada')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar categoría" maxWidth="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-text2 dark:text-text2-dark mb-1.5">Nombre</label>
          <input
            autoFocus
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-2 dark:bg-surface-2dark border-2 border-transparent focus:border-primary dark:focus:border-primary-dark outline-none text-sm text-text1 dark:text-text1-dark transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text2 dark:text-text2-dark mb-1">Color</label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-surface-2 dark:bg-surface-2dark text-sm font-medium text-text1 dark:text-text1-dark hover:opacity-80 transition-opacity">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !nombre.trim()}
            className="flex-1 py-2.5 rounded-xl bg-primary dark:bg-primary-dark text-white text-sm font-medium disabled:opacity-50 hover:bg-primary-hover transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function Settings() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories()
  const toast = useToast()

  const [editingCat, setEditingCat] = useState<CategoryRow | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(COLOR_PALETTE[0])
  const [addingCat, setAddingCat] = useState(false)

  const handleAddCategory = async () => {
    if (!newName.trim()) return
    setAddingCat(true)
    const { error } = await addCategory(newName.trim(), newColor)
    setAddingCat(false)
    if (error) { toast('error', error); return }
    toast('success', 'Categoría creada')
    setNewName('')
    setNewColor(COLOR_PALETTE[0])
    setShowAddModal(false)
  }

  const handleDelete = async (id: string) => {
    const { error } = await deleteCategory(id)
    setConfirmDeleteId(null)
    if (error) { toast('error', error); return }
    toast('success', 'Categoría eliminada')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-24 sm:pb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 dark:bg-primary-dark/10">
            <Settings2 size={20} className="text-primary dark:text-primary-dark" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text1 dark:text-text1-dark">Categorías</h1>
            <p className="text-sm text-text2 dark:text-text2-dark">Personalizá tus categorías y subcategorías</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary dark:bg-primary-dark text-white text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Nueva</span>
        </button>
      </div>

      {/* Category list */}
      <div className="space-y-3">
        {categories.map((cat) => (
          <Card key={cat.id} padding="md">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                <span className="font-semibold text-text1 dark:text-text1-dark truncate">{cat.nombre}</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setEditingCat(cat)}
                  className="p-1.5 rounded-lg text-text2 dark:text-text2-dark hover:bg-surface-2 dark:hover:bg-surface-2dark transition-colors"
                  title="Editar nombre y color"
                >
                  <Pencil size={14} />
                </button>
                {confirmDeleteId === cat.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="px-2 py-1 rounded-lg bg-danger text-white text-xs font-medium"
                    >
                      Eliminar
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1 rounded-lg text-xs text-text2 dark:text-text2-dark hover:bg-surface-2 dark:hover:bg-surface-2dark"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(cat.id)}
                    className="p-1.5 rounded-lg text-text2 dark:text-text2-dark hover:text-danger hover:bg-danger/10 transition-colors"
                    title="Eliminar categoría"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
            <SubcategoryChips cat={cat} onUpdate={updateCategory} />
          </Card>
        ))}
      </div>

      {/* Add category modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Nueva categoría" maxWidth="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text2 dark:text-text2-dark mb-1.5">Nombre</label>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory() }}
              placeholder="Ej: Entretenimiento"
              className="w-full px-3 py-2.5 rounded-xl bg-surface-2 dark:bg-surface-2dark border-2 border-transparent focus:border-primary dark:focus:border-primary-dark outline-none text-sm text-text1 dark:text-text1-dark transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text2 dark:text-text2-dark mb-1">Color</label>
            <ColorPicker value={newColor} onChange={setNewColor} />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl bg-surface-2 dark:bg-surface-2dark text-sm font-medium text-text1 dark:text-text1-dark hover:opacity-80 transition-opacity">
              Cancelar
            </button>
            <button
              onClick={handleAddCategory}
              disabled={addingCat || !newName.trim()}
              className="flex-1 py-2.5 rounded-xl bg-primary dark:bg-primary-dark text-white text-sm font-medium disabled:opacity-50 hover:bg-primary-hover transition-colors"
            >
              {addingCat ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit category modal */}
      {editingCat && (
        <EditCategoryModal
          cat={editingCat}
          open={!!editingCat}
          onClose={() => setEditingCat(null)}
          onUpdate={updateCategory}
        />
      )}
    </div>
  )
}
