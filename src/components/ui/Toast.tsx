import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import type { ToastMessage } from '../../types'

interface ToastContextValue {
  toast: (type: ToastMessage['type'], message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const toast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onRemove={remove} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const start = Date.now()
    const duration = 3000
    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      setProgress(Math.max(0, 100 - (elapsed / duration) * 100))
    }, 50)
    return () => clearInterval(timer)
  }, [])

  const icons = {
    success: <CheckCircle size={18} className="text-teal" />,
    error: <XCircle size={18} className="text-danger" />,
    info: <Info size={18} className="text-primary" />,
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="pointer-events-auto relative overflow-hidden bg-surface dark:bg-surface-dark rounded-xl shadow-lg border border-black/10 dark:border-white/10 px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-sm"
    >
      {icons[toast.type]}
      <span className="text-sm font-medium text-text1 dark:text-text1-dark flex-1">
        {toast.message}
      </span>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-text2 dark:text-text2-dark hover:text-text1 dark:hover:text-text1-dark transition-colors"
      >
        <X size={14} />
      </button>
      {/* Barra de progreso */}
      <div
        className="absolute bottom-0 left-0 h-0.5 bg-primary dark:bg-primary-dark transition-all duration-75"
        style={{ width: `${progress}%` }}
      />
    </motion.div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx.toast
}
