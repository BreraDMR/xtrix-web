import { useEffect, useId, useRef, useState, type ComponentType, type KeyboardEvent } from 'react'
import { LuEllipsis } from 'react-icons/lu'

export type ActionMenuItem = {
  key: string
  label: string
  icon?: ComponentType<{ className?: string }>
  onSelect: () => void
}

// The "everything else" button next to a page's main action. A plain menu button:
// arrows move between items, Escape or Tab closes it, focus goes back to the button.
export default function ActionMenu({ label, items, className = '' }: {
  label: string
  items: ActionMenuItem[]
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    itemRefs.current[0]?.focus()
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [open])

  if (items.length === 0) return null

  const close = (refocus = true) => {
    setOpen(false)
    if (refocus) trigger.current?.focus()
  }
  const move = (event: KeyboardEvent) => {
    const current = itemRefs.current.findIndex(item => item === document.activeElement)
    const last = items.length - 1
    const next = {
      ArrowDown: current >= last ? 0 : current + 1,
      ArrowUp: current <= 0 ? last : current - 1,
      Home: 0,
      End: last,
    }[event.key]
    if (next !== undefined) {
      event.preventDefault()
      itemRefs.current[next]?.focus()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      close()
    } else if (event.key === 'Tab') {
      close(false)
    }
  }

  return <div ref={root} className={`relative ${className}`}>
    <button ref={trigger} type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined}
      aria-label={label} title={label} onClick={() => setOpen(value => !value)}
      onKeyDown={event => { if (event.key === 'ArrowDown' && !open) { event.preventDefault(); setOpen(true) } }}
      className="ui-button ui-button-secondary px-3">
      <LuEllipsis className="h-4 w-4" aria-hidden="true" />
    </button>
    {open && <div id={menuId} role="menu" aria-label={label} onKeyDown={move}
      className="absolute right-0 z-30 mt-1 min-w-44 rounded-[var(--radius-control)] border border-[var(--workspace-line)] bg-[var(--workspace-panel)] p-1 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
      {items.map((item, index) => {
        const Icon = item.icon
        return <button key={item.key} ref={node => { itemRefs.current[index] = node }} type="button" role="menuitem" tabIndex={-1}
          onClick={() => { close(false); item.onSelect() }}
          className="flex w-full items-center gap-2 rounded-[calc(var(--radius-control)-2px)] px-3 py-2 text-left text-sm text-[var(--workspace-ink)] hover:bg-[var(--workspace-fill)] focus:bg-[var(--workspace-fill)] focus:outline-none">
          {Icon && <Icon className="h-4 w-4 text-[var(--workspace-muted)]" />}
          {item.label}
        </button>
      })}
    </div>}
  </div>
}
