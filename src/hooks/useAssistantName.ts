import { useAuthStore } from '../store/authStore'
import { useLocaleStore } from '../store/localeStore'
import { assistantT, effectiveAssistant, type AssistantKey, type AssistantPersona, type AssistantTextOptions } from '../i18n/assistant'
import { useMyBusiness } from './useMyBusiness'

// The name the assistant goes by for this user: the business's own, or the default for the UI
// language (also while loading and when the business can't be read).
export function useAssistantName(): AssistantPersona {
  const locale = useLocaleStore((state) => state.locale)
  const businessId = useAuthStore((state) => state.user?.business_id)
  const { data } = useMyBusiness(!!businessId)
  return effectiveAssistant(businessId ? data : null, locale)
}

// assistantT with the name, gender and UI language already filled in
export function useAssistantText() {
  const locale = useLocaleStore((state) => state.locale)
  const { name, gender } = useAssistantName()
  return (key: AssistantKey, options: Omit<AssistantTextOptions, 'name' | 'gender'> = {}) =>
    assistantT(locale, key, { ...options, name, gender })
}
