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

  const bgColor = {
    success: 'bg-white border-l-4 border-[#1f7a3a] text-brand-ink',
    error: 'bg-white border-l-4 border-[#c81e1e] text-brand-ink',
    info: 'bg-white border-l-4 border-brand-purple text-brand-ink',
  }[type]

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  }[type]

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className={`${bgColor} px-5 py-3.5 rounded-card shadow-card-hover flex items-center gap-3 min-w-[300px] text-[13px] font-semibold`}>
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${type === 'success' ? 'bg-[#1f7a3a]' : type === 'error' ? 'bg-[#c81e1e]' : 'bg-brand-gradient'}`}>{icon}</span>
        <span className="flex-1">{message}</span>
        <button
          onClick={onClose}
          className="text-[#9b9ba3] hover:text-brand-ink font-bold text-lg"
        >
          ×
        </button>
      </div>
    </div>
  )
}


