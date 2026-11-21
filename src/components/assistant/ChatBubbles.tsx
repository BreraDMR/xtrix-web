import type { ReactNode } from 'react'
import { LuSparkles } from 'react-icons/lu'

// The chat reads like a messenger: the assistant talks on the left, the person on the right,
// and what the assistant is about to do (or did) sits in the middle as a log card.

export function AssistantBubble({ name, children, tone = 'plain' }: { name: string; children: ReactNode; tone?: 'plain' | 'muted' }) {
  return (
    <div className="flex items-start gap-2">
      <span
        className="mt-5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--workspace-accent-soft)] text-[var(--workspace-accent-ink)]"
        aria-hidden="true"
      >
        <LuSparkles className="h-4 w-4" />
      </span>
      <div className="min-w-0 max-w-[75%]">
        <p className="mb-1 text-xs font-medium text-[var(--workspace-accent-ink)]">{name}</p>
        <div
          className={`rounded-2xl rounded-tl-sm px-3 py-2 text-sm shadow-sm ${tone === 'muted'
            ? 'bg-[var(--workspace-fill)] text-[var(--workspace-muted)]'
            : 'bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100'}`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export function UserBubble({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="min-w-0 max-w-[75%] text-right">
        <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="inline-block whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm bg-[var(--workspace-accent-fill)] px-3 py-2 text-left text-sm text-white">
          <span className="sr-only">{label}: </span>
          {children}
        </p>
      </div>
    </div>
  )
}

// a technical problem (network, failed request) is neither side's line, so it sits in the middle
export function SystemLine({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mx-auto max-w-xl rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
      {children}
    </p>
  )
}

// the plan's steps, buttons and results, centred between the two sides
export function LogCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section
      aria-label={label}
      className="mx-auto w-full max-w-xl rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-800 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
    >
      {children}
    </section>
  )
}
