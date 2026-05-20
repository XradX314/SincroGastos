import { motion, AnimatePresence } from 'framer-motion'
import { Home, User, HelpCircle, Baby, type LucideIcon, Tag } from 'lucide-react'
import { useCategories } from '../../contexts/CategoriesContext'

const ICON_MAP: Record<string, LucideIcon> = {
  'Casa':   Home,
  'Hijo 1': Baby,
  'Hijo 2': Baby,
  'Hijo 3': Baby,
  'Yo':     User,
  'Otros':  HelpCircle,
}

interface CategorySelectorProps {
  selectedCategory: string | null
  selectedSubcategory: string | null
  onCategoryChange: (cat: string) => void
  onSubcategoryChange: (sub: string) => void
}

export function CategorySelector({
  selectedCategory,
  selectedSubcategory,
  onCategoryChange,
  onSubcategoryChange,
}: CategorySelectorProps) {
  const { categories, colorsMap } = useCategories()

  return (
    <div className="space-y-3">
      {/* Grilla de categorías */}
      <div className="grid grid-cols-3 gap-2">
        {categories.map((cat) => {
          const Icon = ICON_MAP[cat.nombre] ?? Tag
          const color = colorsMap[cat.nombre] ?? '#6B7280'
          const isSelected = selectedCategory === cat.nombre

          return (
            <motion.button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.nombre)}
              whileTap={{ scale: 0.96 }}
              className={[
                'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all',
                isSelected
                  ? 'border-current shadow-sm'
                  : 'border-transparent bg-surface-2 dark:bg-surface-2dark hover:border-black/10 dark:hover:border-white/10',
              ].join(' ')}
              style={isSelected ? { borderColor: color, background: `${color}18` } : {}}
            >
              <div
                className="p-2 rounded-lg"
                style={isSelected ? { background: `${color}25`, color } : { background: 'transparent', color: '#6B7280' }}
              >
                <Icon size={20} />
              </div>
              <span
                className="text-xs font-medium leading-tight text-center"
                style={isSelected ? { color } : { color: 'inherit' }}
              >
                {cat.nombre}
              </span>
            </motion.button>
          )
        })}
      </div>

      {/* Subcategorías */}
      <AnimatePresence mode="wait">
        {selectedCategory && (
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="text-xs font-medium text-text2 dark:text-text2-dark mb-2">Subcategoría</p>
            <div className="flex flex-wrap gap-2">
              {(categories.find((c) => c.nombre === selectedCategory)?.subcategorias ?? []).map((sub) => {
                const isActive = selectedSubcategory === sub
                const color = colorsMap[selectedCategory] ?? '#6B7280'
                return (
                  <motion.button
                    key={sub}
                    type="button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => onSubcategoryChange(sub)}
                    className={[
                      'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                      isActive
                        ? 'text-white border-transparent'
                        : 'bg-surface-2 dark:bg-surface-2dark border-transparent text-text2 dark:text-text2-dark hover:border-black/10 dark:hover:border-white/10',
                    ].join(' ')}
                    style={isActive ? { background: color, borderColor: color } : {}}
                  >
                    {sub}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
