import { useId, type ReactNode } from 'react'
import { HiOutlineX } from 'react-icons/hi'
import { useTranslation } from '../hooks/useTranslation'
import { useNativeDialog } from '../hooks/useNativeDialog'

export default function Modal({ title, onClose, busy = false, wide = false, children }: {
  title: string
  onClose: () => void
  busy?: boolean
  wide?: boolean
  children: ReactNode
}) {
  const { t } = useTranslation()
  const titleId = useId()
  const { dialog, isTopDialog } = useNativeDialog()
  return <dialog ref={dialog} aria-labelledby={titleId}
    onCancel={event => {
      event.preventDefault()
      event.stopPropagation()
      if (isTopDialog() && !busy) onClose()
    }}
    onClick={event => {
      if (event.target !== event.currentTarget) return
      event.stopPropagation()
      if (!isTopDialog() || busy) return
      const box = event.currentTarget.getBoundingClientRect()
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose()
    }}
    className={`fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] overflow-y-auto rounded-lg border border-[var(--workspace-line)] bg-[var(--workspace-panel)] p-0 text-[var(--workspace-ink)] shadow-lg backdrop:bg-black/35 ${wide ? 'max-w-4xl' : 'max-w-md'}`}>
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[var(--workspace-line)] bg-[var(--workspace-panel)] px-5 py-4">
      <h2 id={titleId} className="text-lg font-semibold tracking-tight">{title}</h2>
      <button type="button" disabled={busy} aria-label={t('common.close')} onClick={onClose}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md hover:bg-[var(--workspace-bg)] disabled:opacity-50">
        <HiOutlineX className="h-5 w-5" />
      </button>
    </header>
    {children}
  </dialog>
}
