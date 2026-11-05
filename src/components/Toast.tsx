import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const accent = {
    success: 'border-[#1f7a3a]',
    error: 'border-[#c81e1e]',
    info: 'border-brand-purple',
  }[type]

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  }[type]

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className={`${accent} flex min-w-[300px] items-center gap-3 rounded-[14px] border-l-4 bg-[var(--workspace-panel)] px-5 py-3.5 text-[13px] font-semibold text-[var(--workspace-ink)] shadow-lg`}>
        <span aria-hidden="true" className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold text-white ${type === 'success' ? 'bg-[#1f7a3a]' : type === 'error' ? 'bg-[#c81e1e]' : 'bg-brand-gradient'}`}>{icon}</span>
        <span className="flex-1">{message}</span>
        <button
          onClick={onClose}
          className="text-lg font-bold text-[var(--workspace-muted)] hover:text-[var(--workspace-ink)]"
        >
          ×
        </button>
      </div>
    </div>
  )
}


