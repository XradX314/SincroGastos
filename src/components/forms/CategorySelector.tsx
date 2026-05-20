import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, User, HelpCircle, Baby, type LucideIcon,
} from 'lucide-react'
import { CATEGORIES, CATEGORY_COLORS } from '../../lib/categoryData'
import type { CategoryName } from '../../types'

const CATEGORY_ICONS: Record<CategoryName, LucideIcon> = {
  'Casa':   Home,
  'Hijo 1': Baby,
  'Hijo 2': Baby,
  'Hijo 3': Baby,
  'Yo':     User,
  'Otros':  HelpCircle,
}

interface CategorySelectorProps {
  selectedCategory: CategoryName | null
  selectedSubcategory: string | null
  onCategoryChange: (cat: CategoryName) => void
  onSubcategoryChange: (sub: string) => void
}

export function CategorySelector({
  selectedCategory,
  selectedSubcategory,
  onCategoryChange,
  onSubcategoryChange,
}: CategorySelectorProps) {
  const categories = Object.keys(CATEGORIES) as CategoryName[]

  return (
    <div className="space-y-3">
      {/* Grilla de categorías */}
      <div className="grid grid-cols-3 gap-2">
        {categories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat]
          const color = CATEGORY_COLORS[cat]
          const isSelected = selectedCategory === cat

          return (
            <motion.button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
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
                {cat}
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
            <p className="text-xs font-medium text-text2-DEFAULT dark:text-text2-dark mb-2">
              Subcategoría
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES[selectedCategory].map((sub) => {
                const isActive = selectedSubcategory === sub
                const color = CATEGORY_COLORS[selectedCategory]
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
                        : 'bg-surface-2 dark:bg-surface-2dark border-transparent text-text2-DEFAULT dark:text-text2-dark hover:border-black/10 dark:hover:border-white/10',
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
