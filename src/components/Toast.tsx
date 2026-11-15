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



  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  }[type]

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className={`flex min-w-[300px] items-center gap-3 rounded-2xl border border-[var(--workspace-card-border)] bg-[color-mix(in_srgb,var(--workspace-panel)_88%,transparent)] px-4 py-3 text-[13.5px] font-medium text-[var(--workspace-ink)] shadow-lg backdrop-blur-xl`}>
        <span aria-hidden="true" className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold text-white ${type === 'success' ? 'bg-[#34c759]' : type === 'error' ? 'bg-[#ff3b30]' : 'bg-brand-gradient'}`}>{icon}</span>
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


