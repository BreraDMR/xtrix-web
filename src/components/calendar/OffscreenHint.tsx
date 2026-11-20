import { LuArrowDown, LuArrowUp } from 'react-icons/lu'
import { useTranslation } from '../../hooks/useTranslation'

// "there is more above/below" for a scrolled time grid - early and late visits are never just cut off
export default function OffscreenHint({ earlier, later, onEarlier, onLater }: {
  earlier: number; later: number; onEarlier: () => void; onLater: () => void
}) {
  const { t } = useTranslation()
  if (earlier === 0 && later === 0) return null
  const chip = 'inline-flex items-center gap-1 rounded-full border border-[var(--workspace-line)] bg-[var(--workspace-panel)] px-2.5 py-1 text-[11px] font-medium text-[var(--workspace-ink)] hover:bg-[var(--workspace-fill)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--workspace-accent)]'
  return <div className="mb-2 flex flex-wrap gap-2" data-offscreen-hint>
    {earlier > 0 && <button type="button" className={chip} onClick={onEarlier}>
      <LuArrowUp aria-hidden="true" className="h-3 w-3" />{t('calendar.earlierVisits').replace('{count}', String(earlier))}
    </button>}
    {later > 0 && <button type="button" className={chip} onClick={onLater}>
      <LuArrowDown aria-hidden="true" className="h-3 w-3" />{t('calendar.laterVisits').replace('{count}', String(later))}
    </button>}
  </div>
}
