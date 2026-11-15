import { useId, type ReactNode } from 'react'
import { LuX } from 'react-icons/lu'
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
    className={`fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] overflow-y-auto rounded-[22px] border border-[var(--workspace-card-border)] bg-[var(--workspace-panel)] p-0 text-[var(--workspace-ink)] shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop:bg-black/25 backdrop:backdrop-blur-sm ${wide ? 'max-w-4xl' : 'max-w-md'}`}>
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[var(--workspace-hairline)] bg-[color-mix(in_srgb,var(--workspace-panel)_85%,transparent)] px-6 py-4 backdrop-blur-xl">
      <h2 id={titleId} className="text-[17px] font-semibold tracking-[-0.02em]">{title}</h2>
      <button type="button" disabled={busy} aria-label={t('common.close')} onClick={onClose}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--workspace-fill)] text-[var(--workspace-muted)] transition-colors hover:text-[var(--workspace-ink)] disabled:opacity-50">
        <LuX className="h-4 w-4" />
      </button>
    </header>
    {children}
  </dialog>
}
