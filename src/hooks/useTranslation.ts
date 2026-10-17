import { useLocaleStore } from '../store/localeStore'
import translations, { TranslationKey } from '../i18n/translations'

export function useTranslation() {
  const locale = useLocaleStore((state) => state.locale)

  const t = (key: TranslationKey, fallback?: string): string => {
    const translation = translations[key]?.[locale]
    if (translation) return translation
    
    const enTranslation = translations[key]?.en
    if (enTranslation) return enTranslation
    
    return fallback || key
  }

  return { t, locale }
}

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
  'fitness_coach': 'specialistType.fitnessCoach',
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

export function getTranslatedSpecialistType(type: string, locale: 'en' | 'ru' | 'cz' = 'en'): string {
  const key = SPECIALIST_TYPE_MAP[type]
  if (key) {
    return translations[key]?.[locale] || translations[key]?.en || type
  }
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

