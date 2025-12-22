export type TranslationKey =
  // Common
  | 'common.save'
  | 'common.cancel'
  | 'common.delete'
  | 'common.edit'
  | 'common.create'
  | 'common.search'
  | 'common.filter'
  | 'common.loading'
  | 'common.error'
  | 'common.success'
  // Specialist types
  | 'specialistType.massage'
  | 'specialistType.cosmetologist'
  | 'specialistType.barber'
  | 'specialistType.hairdresser'
  | 'specialistType.esthetician'
  | 'specialistType.nailTechnician'
  | 'specialistType.lashTechnician'
  | 'specialistType.makeupArtist'
  | 'specialistType.physiotherapist'
  | 'specialistType.nutritionist'
  | 'specialistType.aromatherapist'
  | 'specialistType.fitnessCoach'
  | 'specialistType.yogaInstructor'
  | 'specialistType.psychologist'
  | 'specialistType.psychotherapist'
  | 'specialistType.therapist'
  | 'specialistType.dentist'
  | 'specialistType.dermatologist'
  | 'specialistType.doctor'
  | 'specialistType.cardiologist'
  | 'specialistType.neurologist'
  | 'specialistType.orthopedist'
  | 'specialistType.gynecologist'
  | 'specialistType.urologist'
  | 'specialistType.ophthalmologist'
  | 'specialistType.endocrinologist'
  | 'specialistType.pediatrician'
  | 'specialistType.surgeon'
  | 'specialistType.oncologist'
  // Categories
  | 'category.beauty'
  | 'category.wellness'
  | 'category.healthcare'
  // Business types
  | 'businessType.individual'
  | 'businessType.salon'
  | 'businessType.clinic'
  | 'businessType.hospital'
  | 'businessType.barbershop'
  | 'businessType.rehabCenter'
  // Registration
  | 'register.title'
  | 'register.fullName'
  | 'register.email'
  | 'register.phone'
  | 'register.password'
  | 'register.confirmPassword'
  | 'register.role'
  | 'register.specialistType'
  | 'register.selectSpecialistType'
  | 'register.createAccount'
  | 'register.alreadyHaveAccount'
  | 'register.signIn'
  | 'register.specialistTypeRequired'
  // Client form
  | 'clientForm.allergies'
  | 'clientForm.chronicDiseases'
  | 'clientForm.healthcareRequired'
  | 'clientForm.healthcareRequiredDescription'
  // Specialist profile
  | 'specialistProfile.title'
  | 'specialistProfile.notFound'
  | 'specialistProfile.verificationPending'
  | 'specialistProfile.verified'
  | 'specialistProfile.basicInfo'
  | 'specialistProfile.specialistType'
  | 'specialistProfile.category'
  | 'specialistProfile.specialization'
  | 'specialistProfile.specializationPlaceholder'
  | 'specialistProfile.experience'
  | 'specialistProfile.experienceYears'
  | 'specialistProfile.years'
  | 'specialistProfile.education'
  | 'specialistProfile.educationPlaceholder'
  | 'specialistProfile.certifications'
  | 'specialistProfile.certificationsPlaceholder'
  | 'specialistProfile.businessInfo'
  | 'specialistProfile.businessName'
  | 'specialistProfile.businessType'
  | 'specialistProfile.address'
  | 'specialistProfile.additionalInfo'
  | 'specialistProfile.description'
  | 'specialistProfile.descriptionPlaceholder'
  | 'specialistProfile.languages'
  | 'specialistProfile.languagesPlaceholder'

const translations: Record<TranslationKey, Record<'en' | 'ru' | 'cz', string>> = {
  // Common
  'common.save': { en: 'Save', ru: 'Сохранить', cz: 'Uložit' },
  'common.cancel': { en: 'Cancel', ru: 'Отмена', cz: 'Zrušit' },
  'common.delete': { en: 'Delete', ru: 'Удалить', cz: 'Smazat' },
  'common.edit': { en: 'Edit', ru: 'Редактировать', cz: 'Upravit' },
  'common.create': { en: 'Create', ru: 'Создать', cz: 'Vytvořit' },
  'common.search': { en: 'Search', ru: 'Поиск', cz: 'Hledat' },
  'common.filter': { en: 'Filter', ru: 'Фильтр', cz: 'Filtr' },
  'common.loading': { en: 'Loading...', ru: 'Загрузка...', cz: 'Načítání...' },
  'common.error': { en: 'Error', ru: 'Ошибка', cz: 'Chyba' },
  'common.success': { en: 'Success', ru: 'Успешно', cz: 'Úspěch' },
  
  // Specialist types - Beauty
  'specialistType.massage': { en: 'Massage Therapist', ru: 'Массажист', cz: 'Masér' },
  'specialistType.cosmetologist': { en: 'Cosmetologist', ru: 'Косметолог', cz: 'Kosmetička' },
  'specialistType.barber': { en: 'Barber', ru: 'Барбер', cz: 'Holič' },
  'specialistType.hairdresser': { en: 'Hairdresser', ru: 'Парикмахер', cz: 'Kadeřník' },
  'specialistType.esthetician': { en: 'Esthetician', ru: 'Эстетист', cz: 'Estetička' },
  'specialistType.nailTechnician': { en: 'Nail Technician', ru: 'Мастер маникюра/педикюра', cz: 'Manikérka' },
  'specialistType.lashTechnician': { en: 'Lash & Brow Technician', ru: 'Мастер по ресницам и бровям', cz: 'Technička řas a obočí' },
  'specialistType.makeupArtist': { en: 'Makeup Artist', ru: 'Визажист', cz: 'Vizážistka' },
  
  // Specialist types - Wellness
  'specialistType.physiotherapist': { en: 'Physiotherapist', ru: 'Физиотерапевт', cz: 'Fyzioterapeut' },
  'specialistType.nutritionist': { en: 'Nutritionist', ru: 'Нутрициолог', cz: 'Výživový poradce' },
  'specialistType.aromatherapist': { en: 'Aromatherapist', ru: 'Ароматерапевт', cz: 'Aromaterapeut' },
  'specialistType.fitnessCoach': { en: 'Fitness Coach', ru: 'Фитнес-тренер', cz: 'Fitness trenér' },
  'specialistType.yogaInstructor': { en: 'Yoga Instructor', ru: 'Инструктор йоги', cz: 'Instruktor jógy' },
  'specialistType.psychologist': { en: 'Psychologist', ru: 'Психолог', cz: 'Psycholog' },
  'specialistType.psychotherapist': { en: 'Psychotherapist', ru: 'Психотерапевт', cz: 'Psychoterapeut' },
  
  // Specialist types - Healthcare
  'specialistType.therapist': { en: 'Therapist', ru: 'Терапевт', cz: 'Terapeut' },
  'specialistType.dentist': { en: 'Dentist', ru: 'Стоматолог', cz: 'Zubař' },
  'specialistType.dermatologist': { en: 'Dermatologist', ru: 'Дерматолог', cz: 'Dermatolog' },
  'specialistType.doctor': { en: 'Doctor', ru: 'Врач-специалист', cz: 'Lékař' },
  'specialistType.cardiologist': { en: 'Cardiologist', ru: 'Кардиолог', cz: 'Kardiolog' },
  'specialistType.neurologist': { en: 'Neurologist', ru: 'Невролог', cz: 'Neurolog' },
  'specialistType.orthopedist': { en: 'Orthopedist', ru: 'Ортопед', cz: 'Ortoped' },
  'specialistType.gynecologist': { en: 'Gynecologist', ru: 'Гинеколог', cz: 'Gynekolog' },
  'specialistType.urologist': { en: 'Urologist', ru: 'Уролог', cz: 'Urolog' },
  'specialistType.ophthalmologist': { en: 'Ophthalmologist', ru: 'Офтальмолог', cz: 'Oftalmolog' },
  'specialistType.endocrinologist': { en: 'Endocrinologist', ru: 'Эндокринолог', cz: 'Endokrinolog' },
  'specialistType.pediatrician': { en: 'Pediatrician', ru: 'Педиатр', cz: 'Pediatr' },
  'specialistType.surgeon': { en: 'Surgeon', ru: 'Хирург', cz: 'Chirurg' },
  'specialistType.oncologist': { en: 'Oncologist', ru: 'Онколог', cz: 'Onkolog' },
  
  // Categories
  'category.beauty': { en: 'Beauty', ru: 'Красота', cz: 'Krása' },
  'category.wellness': { en: 'Wellness', ru: 'Велнес', cz: 'Wellness' },
  'category.healthcare': { en: 'Healthcare', ru: 'Здравоохранение', cz: 'Zdravotní péče' },
  
  // Business types
  'businessType.individual': { en: 'Individual Specialist', ru: 'Индивидуальный специалист', cz: 'Individuální specialista' },
  'businessType.salon': { en: 'Beauty Salon', ru: 'Салон красоты', cz: 'Kosmetický salón' },
  'businessType.clinic': { en: 'Clinic', ru: 'Клиника', cz: 'Klinika' },
  'businessType.hospital': { en: 'Hospital', ru: 'Больница', cz: 'Nemocnice' },
  'businessType.barbershop': { en: 'Barbershop', ru: 'Барбершоп', cz: 'Holičství' },
  'businessType.rehabCenter': { en: 'Rehabilitation Center', ru: 'Реабилитационный центр', cz: 'Rehabilitační centrum' },
  
  // Registration
  'register.title': { en: 'Create your account', ru: 'Создайте свой аккаунт', cz: 'Vytvořte si účet' },
  'register.fullName': { en: 'Full Name', ru: 'Полное имя', cz: 'Celé jméno' },
  'register.email': { en: 'Email', ru: 'Email', cz: 'Email' },
  'register.phone': { en: 'Phone', ru: 'Телефон', cz: 'Telefon' },
  'register.password': { en: 'Password', ru: 'Пароль', cz: 'Heslo' },
  'register.confirmPassword': { en: 'Confirm Password', ru: 'Подтвердите пароль', cz: 'Potvrďte heslo' },
  'register.role': { en: 'Role', ru: 'Роль', cz: 'Role' },
  'register.specialistType': { en: 'Specialist Type', ru: 'Тип специалиста', cz: 'Typ specialisty' },
  'register.selectSpecialistType': { en: 'Select specialist type', ru: 'Выберите тип специалиста', cz: 'Vyberte typ specialisty' },
  'register.createAccount': { en: 'Create Account', ru: 'Создать аккаунт', cz: 'Vytvořit účet' },
  'register.alreadyHaveAccount': { en: 'Already have an account?', ru: 'Уже есть аккаунт?', cz: 'Již máte účet?' },
  'register.signIn': { en: 'Sign in', ru: 'Войти', cz: 'Přihlásit se' },
  'register.specialistTypeRequired': { en: 'Please select your specialist type', ru: 'Пожалуйста, выберите тип специалиста', cz: 'Vyberte prosím typ specialisty' },
  
  // Client form
  'clientForm.allergies': { en: 'Allergies', ru: 'Аллергии', cz: 'Alergie' },
  'clientForm.chronicDiseases': { en: 'Chronic Diseases', ru: 'Хронические заболевания', cz: 'Chronická onemocnění' },
  'clientForm.healthcareRequired': { en: 'Required for Healthcare Specialists', ru: 'Обязательно для медицинских специалистов', cz: 'Povinné pro zdravotnické specialisty' },
  'clientForm.healthcareRequiredDescription': { en: 'For healthcare specialists, allergies and chronic diseases are required fields.', ru: 'Для медицинских специалистов поля аллергии и хронических заболеваний являются обязательными.', cz: 'Pro zdravotnické specialisty jsou pole alergie a chronická onemocnění povinná.' },
  
  // Specialist profile
  'specialistProfile.title': { en: 'My Specialist Profile', ru: 'Мой профиль специалиста', cz: 'Můj profil specialisty' },
  'specialistProfile.notFound': { en: 'Specialist profile not found. Please create your profile.', ru: 'Профиль специалиста не найден. Пожалуйста, создайте профиль.', cz: 'Profil specialisty nebyl nalezen. Vytvořte prosím profil.' },
  'specialistProfile.verificationPending': { en: 'Your profile is pending verification.', ru: 'Ваш профиль ожидает верификации.', cz: 'Váš profil čeká na ověření.' },
  'specialistProfile.verified': { en: 'Your profile is verified.', ru: 'Ваш профиль верифицирован.', cz: 'Váš profil je ověřen.' },
  'specialistProfile.basicInfo': { en: 'Basic Information', ru: 'Основная информация', cz: 'Základní informace' },
  'specialistProfile.specialistType': { en: 'Specialist Type', ru: 'Тип специалиста', cz: 'Typ specialisty' },
  'specialistProfile.category': { en: 'Category', ru: 'Категория', cz: 'Kategorie' },
  'specialistProfile.specialization': { en: 'Specialization', ru: 'Специализация', cz: 'Specializace' },
  'specialistProfile.specializationPlaceholder': { en: 'Describe your specialization...', ru: 'Опишите вашу специализацию...', cz: 'Popište svou specializaci...' },
  'specialistProfile.experience': { en: 'Experience', ru: 'Опыт работы', cz: 'Zkušenosti' },
  'specialistProfile.experienceYears': { en: 'Years of Experience', ru: 'Лет опыта', cz: 'Let zkušeností' },
  'specialistProfile.years': { en: 'years', ru: 'лет', cz: 'let' },
  'specialistProfile.education': { en: 'Education', ru: 'Образование', cz: 'Vzdělání' },
  'specialistProfile.educationPlaceholder': { en: 'Your education background...', ru: 'Ваше образование...', cz: 'Vaše vzdělání...' },
  'specialistProfile.certifications': { en: 'Certifications', ru: 'Сертификаты', cz: 'Certifikáty' },
  'specialistProfile.certificationsPlaceholder': { en: 'Your certifications and licenses...', ru: 'Ваши сертификаты и лицензии...', cz: 'Vaše certifikáty a licence...' },
  'specialistProfile.businessInfo': { en: 'Business Information', ru: 'Информация о бизнесе', cz: 'Obchodní informace' },
  'specialistProfile.businessName': { en: 'Business Name', ru: 'Название бизнеса', cz: 'Název podniku' },
  'specialistProfile.businessType': { en: 'Business Type', ru: 'Тип бизнеса', cz: 'Typ podniku' },
  'specialistProfile.address': { en: 'Address', ru: 'Адрес', cz: 'Adresa' },
  'specialistProfile.additionalInfo': { en: 'Additional Information', ru: 'Дополнительная информация', cz: 'Další informace' },
  'specialistProfile.description': { en: 'Description', ru: 'Описание', cz: 'Popis' },
  'specialistProfile.descriptionPlaceholder': { en: 'Public description...', ru: 'Публичное описание...', cz: 'Veřejný popis...' },
  'specialistProfile.languages': { en: 'Languages', ru: 'Языки', cz: 'Jazyky' },
  'specialistProfile.languagesPlaceholder': { en: 'e.g., English, Russian, Czech', ru: 'например, Английский, Русский, Чешский', cz: 'např. Angličtina, Ruština, Čeština' },
}

export default translations

