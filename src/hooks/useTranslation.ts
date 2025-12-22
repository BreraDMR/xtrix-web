import { useLocaleStore } from '../store/localeStore'
import translations, { TranslationKey } from '../i18n/translations'

export function useTranslation() {
  const locale = useLocaleStore((state) => state.locale)

  const t = (key: TranslationKey, fallback?: string): string => {
    const translation = translations[key]?.[locale]
    if (translation) return translation
    
    // Fallback to English
    const enTranslation = translations[key]?.en
    if (enTranslation) return enTranslation
    
    // Fallback to provided fallback or key
    return fallback || key
  }

  return { t, locale }
}

// Map API specialist type values to translation keys
const SPECIALIST_TYPE_MAP: Record<string, TranslationKey> = {
  'massage': 'specialistType.massage',
  'cosmetologist': 'specialistType.cosmetologist',
  'barber': 'specialistType.barber',
  'hairdresser': 'specialistType.hairdresser',
  'esthetician': 'specialistType.esthetician',
  'nail_technician': 'specialistType.nailTechnician',
  'lash_technician': 'specialistType.lashTechnician',
  'makeup_artist': 'specialistType.makeupArtist',
  'physiotherapist': 'specialistType.physiotherapist',
  'nutritionist': 'specialistType.nutritionist',
  'aromatherapist': 'specialistType.aromatherapist',
  'fitness_trainer': 'specialistType.fitnessCoach',
  'yoga_instructor': 'specialistType.yogaInstructor',
  'psychologist': 'specialistType.psychologist',
  'psychotherapist': 'specialistType.psychotherapist',
  'therapist': 'specialistType.therapist',
  'dentist': 'specialistType.dentist',
  'dermatologist': 'specialistType.dermatologist',
  'doctor': 'specialistType.doctor',
  'cardiologist': 'specialistType.cardiologist',
  'neurologist': 'specialistType.neurologist',
  'orthopedist': 'specialistType.orthopedist',
  'gynecologist': 'specialistType.gynecologist',
  'urologist': 'specialistType.urologist',
  'ophthalmologist': 'specialistType.ophthalmologist',
  'endocrinologist': 'specialistType.endocrinologist',
  'pediatrician': 'specialistType.pediatrician',
  'surgeon': 'specialistType.surgeon',
  'oncologist': 'specialistType.oncologist',
}

// Helper function to get translated specialist type
export function getTranslatedSpecialistType(type: string, locale: 'en' | 'ru' | 'cz' = 'en'): string {
  const key = SPECIALIST_TYPE_MAP[type]
  if (key) {
    return translations[key]?.[locale] || translations[key]?.en || type
  }
  // Fallback: capitalize and replace underscores
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

