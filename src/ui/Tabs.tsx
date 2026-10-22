import { useRef, type KeyboardEvent } from 'react'

type Tab<T extends string> = { id: T; label: string }

type Props<T extends string> = {
  tabs: readonly Tab<T>[]
  value: T
  onChange: (id: T) => void
  label: string
  className?: string
}

// Underlined section tabs for pages with several views. Arrow keys move between tabs,
// and only the selected one sits in the Tab order, like a native tab strip.
export default function Tabs<T extends string>({ tabs, value, onChange, label, className = '' }: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = tabs.findIndex((tab) => tab.id === value)
    let next = -1
    if (event.key === 'ArrowRight') next = (current + 1) % tabs.length
    else if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = tabs.length - 1
    if (next < 0) return
    event.preventDefault()
    onChange(tabs[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`mb-6 flex gap-1 overflow-x-auto border-b border-[var(--workspace-line)] ${className}`}
    >
      {tabs.map((tab, index) => {
        const selected = tab.id === value
        return (
          <button
            key={tab.id}
            ref={(element) => { refs.current[index] = element }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--workspace-focus)] ${
              selected
                ? 'border-[var(--workspace-accent)] text-[var(--workspace-ink)]'
                : 'border-transparent text-[var(--workspace-muted)] hover:text-[var(--workspace-ink)]'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
