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
      className={`mb-6 inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-[var(--workspace-fill)] p-1 ${className}`}
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
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-[length:var(--text-control)] font-medium tracking-[-0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--workspace-focus)] ${
              selected
                ? 'bg-[var(--workspace-panel)] text-[var(--workspace-ink)] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.04)]'
                : 'text-[var(--workspace-muted)] hover:text-[var(--workspace-ink)]'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
