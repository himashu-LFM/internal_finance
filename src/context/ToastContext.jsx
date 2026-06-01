import { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '../utils/cn'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, variant = 'success') => {
    const id = Date.now()
    setToasts((t) => [...t, { id, message, variant }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 3500)
  }, [])

  const dismiss = (id) => setToasts((t) => t.filter((x) => x.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 no-print">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg min-w-[280px] max-w-md animate-in slide-in-from-right',
              t.variant === 'success' && 'bg-white border-green-200 text-green-900',
              t.variant === 'error' && 'bg-white border-red-200 text-red-900',
              t.variant === 'info' && 'bg-white border-blue-200 text-slate-900'
            )}
          >
            {t.variant === 'success' && <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />}
            {t.variant === 'error' && <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />}
            {t.variant === 'info' && <Info className="h-5 w-5 text-blue-500 shrink-0" />}
            <span className="text-sm flex-1">{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
