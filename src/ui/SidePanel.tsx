import { useId, type ReactNode } from 'react'
import { LuX } from 'react-icons/lu'
import { useTranslation } from '../hooks/useTranslation'
import { useNativeDialog } from '../hooks/useNativeDialog'

export default function SidePanel({ title, onClose, children, fallbackFocusId }: {
  title: string
  onClose: () => void
  children: ReactNode
  fallbackFocusId?: string
}) {
  const { t } = useTranslation()
  const { dialog, isTopDialog } = useNativeDialog(fallbackFocusId)
  const titleId = useId()

  return <dialog ref={dialog} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); event.stopPropagation(); if (isTopDialog()) onClose() }}
    onClick={event => { if (event.target === event.currentTarget) {
      event.stopPropagation()
      if (!isTopDialog()) return
      const rect = event.currentTarget.getBoundingClientRect()
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose()
    } }}
    className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-full border-l border-[var(--workspace-hairline)] bg-[var(--workspace-panel)] p-0 text-[var(--workspace-ink)] shadow-[0_0_80px_rgba(0,0,0,0.16)] backdrop:bg-black/20 backdrop:backdrop-blur-sm sm:w-[560px] sm:rounded-l-[var(--radius-sheet)]">
    <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between gap-4 border-b border-[var(--workspace-hairline)] bg-[color-mix(in_srgb,var(--workspace-panel)_85%,transparent)] px-6 py-3 backdrop-blur-xl">
      <h2 id={titleId} className="text-[length:var(--text-title)] font-semibold tracking-[-0.02em]">{title}</h2>
      <button type="button" aria-label={t('common.close')} onClick={onClose}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--workspace-fill)] text-[var(--workspace-muted)] transition-colors hover:text-[var(--workspace-ink)]">
        <LuX className="h-4 w-4" />
      </button>
    </header>
    <div className="min-w-0 p-6 sm:p-7">{children}</div>
  </dialog>
}
