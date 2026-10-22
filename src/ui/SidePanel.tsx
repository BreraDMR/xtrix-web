import { useEffect, useId, useRef, type ReactNode } from 'react'
import { HiOutlineX } from 'react-icons/hi'
import { useTranslation } from '../hooks/useTranslation'

export default function SidePanel({ title, onClose, children }: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const { t } = useTranslation()
  const dialog = useRef<HTMLDialogElement>(null)
  const opener = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null)
  const titleId = useId()
  useEffect(() => {
    const element = dialog.current
    const trigger = opener.current
    const previousOverflow = document.body.style.overflow
    element?.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      element?.close()
      document.body.style.overflow = previousOverflow
      if (trigger?.isConnected) trigger.focus()
    }
  }, [])

  return <dialog ref={dialog} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose() }}
    onClick={event => { if (event.target === event.currentTarget) {
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
