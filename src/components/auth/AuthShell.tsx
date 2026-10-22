import { useId, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import LanguageSwitcher from '../LanguageSwitcher'

export default function AuthShell({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  const titleId = useId()
  return <main className="min-h-screen bg-[var(--workspace-bg)] px-4 py-6 text-[var(--workspace-ink)] sm:px-6 sm:py-10">
    <header className="mx-auto flex max-w-5xl items-center justify-between gap-4">
      <Link to="/" aria-label="Xtrix" className="inline-flex items-center gap-2.5 text-xl font-semibold tracking-tight">
        <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-md bg-[var(--workspace-ink)] text-2xl leading-none text-[var(--workspace-panel)]">x</span>
        Xtrix
      </Link>
      <LanguageSwitcher />
    </header>
    <section aria-labelledby={titleId} className="ui-card mx-auto mt-8 w-full max-w-md space-y-6 p-6 sm:mt-12 sm:p-8">
      <div>
        <h1 id={titleId} className="text-2xl font-semibold leading-tight tracking-tight">{title}</h1>
        {description && <p className="mt-2 text-sm leading-relaxed text-[var(--workspace-muted)]">{description}</p>}
      </div>
      {children}
    </section>
  </main>
}
