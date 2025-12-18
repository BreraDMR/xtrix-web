import { useLocaleStore } from '../store/localeStore'
import { t } from '../i18n/translations'

export function useTranslation() {
  const { locale } = useLocaleStore()
  
  return {
    t: (key: Parameters<typeof t>[0]) => t(key, locale),
    locale,
  }
}

