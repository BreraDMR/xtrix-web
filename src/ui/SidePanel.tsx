import { useId, type ReactNode } from 'react'
import { HiOutlineX } from 'react-icons/hi'
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
    className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-full border-l border-[var(--workspace-line)] bg-[var(--workspace-panel)] p-0 text-[var(--workspace-ink)] shadow-lg backdrop:bg-black/30 sm:w-[560px]">
    <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between gap-4 border-b border-[var(--workspace-line)] bg-[var(--workspace-panel)] px-5 py-3">
      <h2 id={titleId} className="text-lg font-semibold tracking-tight">{title}</h2>
      <button type="button" aria-label={t('common.close')} onClick={onClose}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-md hover:bg-[var(--workspace-bg)]">
        <HiOutlineX className="h-5 w-5" />
      </button>
    </header>
    <div className="min-w-0 p-5 sm:p-6">{children}</div>
  </dialog>
}
