import { useTranslation } from '../hooks/useTranslation'

export default function QueryError({ retry }: { retry: () => unknown }) {
  const { t } = useTranslation()
  return (
    <div role="alert" className="rounded-lg border border-[color-mix(in_srgb,var(--tint-red-ink)_25%,transparent)] bg-[var(--tint-red)] p-6 text-[var(--tint-red-ink)]">
      <p>{t('common.loadError')}</p>
      <button type="button" onClick={() => void retry()} className="mt-3 rounded border border-[color-mix(in_srgb,var(--tint-red-ink)_40%,transparent)] px-4 py-2">
        {t('common.retry')}
      </button>
    </div>
  )
}
