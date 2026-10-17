import { useTranslation } from '../hooks/useTranslation'

export default function QueryError({ retry }: { retry: () => unknown }) {
  const { t } = useTranslation()
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
      <p>{t('common.loadError')}</p>
      <button type="button" onClick={() => void retry()} className="mt-3 rounded border border-red-300 px-4 py-2">
        {t('common.retry')}
      </button>
    </div>
  )
}
