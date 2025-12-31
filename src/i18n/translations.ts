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
  // Navigation
  | 'nav.dashboard'
  | 'nav.clients'
  | 'nav.visits'
  | 'nav.calendar'
  | 'nav.services'
  | 'nav.profile'
  | 'nav.logout'
  // Login
  | 'login.title'
  | 'login.subtitle'
  | 'login.email'
  | 'login.password'
  | 'login.signIn'
  | 'login.loggingIn'
  | 'login.dontHaveAccount'
  | 'login.signUp'
  | 'login.failed'
  // Dashboard
  | 'dashboard.title'
  | 'dashboard.subtitle'
  | 'dashboard.monthlyRevenue'
  | 'dashboard.thisMonth'
  // Clients
  | 'clients.title'
  | 'clients.addClient'
  | 'clients.searchPlaceholder'
  | 'clients.allGenders'
  | 'clients.male'
  | 'clients.female'
  | 'clients.other'
  | 'clients.clearFilters'
  | 'clients.noClientsMatch'
  | 'clients.noClientsFound'
  | 'clients.name'
  | 'clients.phone'
  | 'clients.email'
  // Services
  | 'services.title'
  | 'services.addService'
  | 'services.searchPlaceholder'
  | 'services.allServices'
  | 'services.activeOnly'
  | 'services.inactiveOnly'
  | 'services.clearFilters'
  | 'services.noServicesMatch'
  | 'services.noServicesFound'
  | 'services.name'
  | 'services.duration'
  | 'services.price'
  | 'services.status'
  | 'services.active'
  | 'services.inactive'
  | 'services.min'
  // Visits
  | 'visits.title'
  | 'visits.newVisit'
  | 'visits.searchPlaceholder'
  | 'visits.allStatuses'
  | 'visits.planned'
  | 'visits.inProgress'
  | 'visits.completed'
  | 'visits.cancelled'
  | 'visits.clearFilters'
  | 'visits.fromDate'
  | 'visits.toDate'
  | 'visits.noVisitsMatch'
  | 'visits.noVisitsFound'
  | 'visits.date'
  | 'visits.service'
  | 'visits.status'
  | 'visits.client'
  | 'visits.serviceName'
  | 'visits.startDateTime'
  | 'visits.endDateTime'
  | 'visits.price'
  | 'visits.notes'
  | 'visits.selectClient'
  | 'visits.selectService'
  | 'visits.createVisit'
  | 'visits.updateVisit'
  // Calendar
  | 'calendar.title'
  | 'calendar.simpleViewDescription'
  | 'calendar.advancedViewDescription'
  | 'calendar.simpleView'
  | 'calendar.advancedView'
  | 'calendar.noVisits'
  | 'calendar.visit'
  | 'calendar.visits'
  | 'calendar.backToCalendar'
  | 'calendar.previous'
  | 'calendar.next'
  | 'calendar.more'
  // Employees
  | 'employees.title'
  | 'employees.add_employee'
  | 'employees.search_placeholder'
  | 'employees.active_only'
  | 'employees.employee'
  | 'employees.position'
  | 'employees.commission'
  | 'employees.base_salary'
  | 'employees.status'
  | 'employees.hired_at'
  | 'employees.actions'
  | 'employees.no_employees'
  | 'employees.unknown'
  | 'employees.active'
  | 'employees.inactive'
  | 'employees.edit_employee'
  | 'employees.fire'
  | 'employees.confirm_fire'
  | 'employees.salary'
  | 'employees.form_coming_soon'
  | 'employees.access_denied'
  | 'employees.select_user'
  | 'employees.select_user_placeholder'
  | 'employees.select_user_required'
  | 'employees.no_available_users'
  | 'employees.position_placeholder'
  | 'employees.permissions'
  | 'employees.permission_create_visits'
  | 'employees.permission_edit_clients'
  | 'employees.permission_view_financials'
  | 'employees.permission_manage_services'
  // Salary
  | 'salary.my_salary'
  | 'salary.current_unpaid'
  | 'salary.unpaid'
  | 'salary.period'
  | 'salary.total_visits'
  | 'salary.completed'
  | 'salary.total'
  | 'salary.total_revenue'
  | 'salary.total_salary'
  | 'salary.base'
  | 'salary.commission'
  | 'salary.notes'
  | 'salary.calculated_at'
  | 'salary.no_unpaid_salary'
  | 'salary.history'
  | 'salary.visits'
  | 'salary.revenue'
  | 'salary.salary'
  | 'salary.status'
  | 'salary.paid_at'
  | 'salary.cancelled'
  | 'salary.paid'
  | 'salary.access_denied'
  | 'salary.no_history'
  | 'salary.mark_paid'
  | 'salary.mark_paid_confirm'
  | 'salary.calculate_salary'
  | 'salary.calculate_success'
  | 'salary.calculate_error'
  | 'salary.mark_paid_success'
  | 'salary.mark_paid_error'
  | 'salary.view_details'
  | 'salary.calculated_by'
  // Nav
  | 'nav.employees'
  | 'nav.my_salary'
  // Common
  | 'common.currency'
  | 'common.close'

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
  
  // Navigation
  'nav.dashboard': { en: 'Dashboard', ru: 'Панель управления', cz: 'Nástěnka' },
  'nav.clients': { en: 'Clients', ru: 'Клиенты', cz: 'Klienti' },
  'nav.visits': { en: 'Visits', ru: 'Визиты', cz: 'Návštěvy' },
  'nav.calendar': { en: 'Calendar', ru: 'Календарь', cz: 'Kalendář' },
  'nav.services': { en: 'Services', ru: 'Услуги', cz: 'Služby' },
  'nav.profile': { en: 'Profile', ru: 'Профиль', cz: 'Profil' },
  'nav.logout': { en: 'Logout', ru: 'Выйти', cz: 'Odhlásit se' },
  
  // Login
  'login.title': { en: 'Sign in to your account', ru: 'Войдите в свой аккаунт', cz: 'Přihlaste se ke svému účtu' },
  'login.subtitle': { en: 'Sign in to your account', ru: 'Войдите в свой аккаунт', cz: 'Přihlaste se ke svému účtu' },
  'login.email': { en: 'Email', ru: 'Email', cz: 'Email' },
  'login.password': { en: 'Password', ru: 'Пароль', cz: 'Heslo' },
  'login.signIn': { en: 'Sign in', ru: 'Войти', cz: 'Přihlásit se' },
  'login.loggingIn': { en: 'Logging in...', ru: 'Вход...', cz: 'Přihlašování...' },
  'login.dontHaveAccount': { en: "Don't have an account?", ru: 'Нет аккаунта?', cz: 'Nemáte účet?' },
  'login.signUp': { en: 'Sign up', ru: 'Зарегистрироваться', cz: 'Registrovat se' },
  'login.failed': { en: 'Login failed', ru: 'Ошибка входа', cz: 'Přihlášení se nezdařilo' },
  
  // Dashboard
  'dashboard.title': { en: 'Dashboard', ru: 'Панель управления', cz: 'Nástěnka' },
  'dashboard.subtitle': { en: 'Overview of your business', ru: 'Обзор вашего бизнеса', cz: 'Přehled vašeho podnikání' },
  'dashboard.monthlyRevenue': { en: 'Monthly Revenue', ru: 'Месячный доход', cz: 'Měsíční příjem' },
  'dashboard.thisMonth': { en: 'This month', ru: 'Этот месяц', cz: 'Tento měsíc' },
  
  // Clients
  'clients.title': { en: 'Clients', ru: 'Клиенты', cz: 'Klienti' },
  'clients.addClient': { en: 'Add Client', ru: 'Добавить клиента', cz: 'Přidat klienta' },
  'clients.searchPlaceholder': { en: 'Search by name, phone, or email...', ru: 'Поиск по имени, телефону или email...', cz: 'Hledat podle jména, telefonu nebo emailu...' },
  'clients.allGenders': { en: 'All Genders', ru: 'Все полы', cz: 'Všechna pohlaví' },
  'clients.male': { en: 'Male', ru: 'Мужской', cz: 'Muž' },
  'clients.female': { en: 'Female', ru: 'Женский', cz: 'Žena' },
  'clients.other': { en: 'Other', ru: 'Другое', cz: 'Jiné' },
  'clients.clearFilters': { en: 'Clear filters', ru: 'Очистить фильтры', cz: 'Vymazat filtry' },
  'clients.noClientsMatch': { en: 'No clients match your filters', ru: 'Нет клиентов, соответствующих фильтрам', cz: 'Žádní klienti neodpovídají filtru' },
  'clients.noClientsFound': { en: 'No clients found', ru: 'Клиенты не найдены', cz: 'Klienti nenalezeni' },
  'clients.name': { en: 'Name', ru: 'Имя', cz: 'Jméno' },
  'clients.phone': { en: 'Phone', ru: 'Телефон', cz: 'Telefon' },
  'clients.email': { en: 'Email', ru: 'Email', cz: 'Email' },
  
  // Services
  'services.title': { en: 'Services', ru: 'Услуги', cz: 'Služby' },
  'services.addService': { en: 'Add Service', ru: 'Добавить услугу', cz: 'Přidat službu' },
  'services.searchPlaceholder': { en: 'Search by service name...', ru: 'Поиск по названию услуги...', cz: 'Hledat podle názvu služby...' },
  'services.allServices': { en: 'All Services', ru: 'Все услуги', cz: 'Všechny služby' },
  'services.activeOnly': { en: 'Active Only', ru: 'Только активные', cz: 'Pouze aktivní' },
  'services.inactiveOnly': { en: 'Inactive Only', ru: 'Только неактивные', cz: 'Pouze neaktivní' },
  'services.clearFilters': { en: 'Clear filters', ru: 'Очистить фильтры', cz: 'Vymazat filtry' },
  'services.noServicesMatch': { en: 'No services match your filters', ru: 'Нет услуг, соответствующих фильтрам', cz: 'Žádné služby neodpovídají filtru' },
  'services.noServicesFound': { en: 'No services found', ru: 'Услуги не найдены', cz: 'Služby nenalezeny' },
  'services.name': { en: 'Name', ru: 'Название', cz: 'Název' },
  'services.duration': { en: 'Duration', ru: 'Длительность', cz: 'Délka trvání' },
  'services.price': { en: 'Price', ru: 'Цена', cz: 'Cena' },
  'services.status': { en: 'Status', ru: 'Статус', cz: 'Stav' },
  'services.active': { en: 'Active', ru: 'Активна', cz: 'Aktivní' },
  'services.inactive': { en: 'Inactive', ru: 'Неактивна', cz: 'Neaktivní' },
  'services.min': { en: 'min', ru: 'мин', cz: 'min' },
  
  // Visits
  'visits.title': { en: 'Visits', ru: 'Визиты', cz: 'Návštěvy' },
  'visits.newVisit': { en: 'New Visit', ru: 'Новый визит', cz: 'Nová návštěva' },
  'visits.searchPlaceholder': { en: 'Search by service or client name...', ru: 'Поиск по услуге или клиенту...', cz: 'Hledat podle služby nebo klienta...' },
  'visits.allStatuses': { en: 'All Statuses', ru: 'Все статусы', cz: 'Všechny stavy' },
  'visits.planned': { en: 'Planned', ru: 'Запланирован', cz: 'Plánováno' },
  'visits.inProgress': { en: 'In Progress', ru: 'В процессе', cz: 'Probíhá' },
  'visits.completed': { en: 'Completed', ru: 'Завершен', cz: 'Dokončeno' },
  'visits.cancelled': { en: 'Cancelled', ru: 'Отменен', cz: 'Zrušeno' },
  'visits.clearFilters': { en: 'Clear filters', ru: 'Очистить фильтры', cz: 'Vymazat filtry' },
  'visits.fromDate': { en: 'From date', ru: 'С даты', cz: 'Od data' },
  'visits.toDate': { en: 'To date', ru: 'По дату', cz: 'Do data' },
  'visits.noVisitsMatch': { en: 'No visits match your filters', ru: 'Нет визитов, соответствующих фильтрам', cz: 'Žádné návštěvy neodpovídají filtru' },
  'visits.noVisitsFound': { en: 'No visits found', ru: 'Визиты не найдены', cz: 'Návštěvy nenalezeny' },
  'visits.date': { en: 'Date', ru: 'Дата', cz: 'Datum' },
  'visits.service': { en: 'Service', ru: 'Услуга', cz: 'Služba' },
  'visits.status': { en: 'Status', ru: 'Статус', cz: 'Stav' },
  'visits.client': { en: 'Client', ru: 'Клиент', cz: 'Klient' },
  'visits.clientList': { en: 'Client List', ru: 'Список клиентов', cz: 'Seznam klientů' },
  'visits.clientSearch': { en: 'Search Client', ru: 'Поиск клиента', cz: 'Vyhledat klienta' },
  'visits.searchClientPlaceholder': { en: 'Phone, email or client name...', ru: 'Телефон, email или имя клиента...', cz: 'Telefon, email nebo jméno klienta...' },
  'visits.searching': { en: 'Searching...', ru: 'Поиск...', cz: 'Vyhledávání...' },
  'visits.clientFromOtherBusiness': { en: 'Client from another business', ru: 'Клиент из другого бизнеса', cz: 'Klient z jiného podniku' },
  'visits.addToMyBusiness': { en: 'Add to my business', ru: 'Добавить в мой бизнес', cz: 'Přidat do mého podniku' },
  'visits.basicMedicalInfo': { en: 'Basic Medical Information', ru: 'Базовая медицинская информация', cz: 'Základní lékařské informace' },
  'visits.serviceName': { en: 'Service Name (if custom)', ru: 'Название услуги (если нестандартная)', cz: 'Název služby (pokud vlastní)' },
  'visits.startDateTime': { en: 'Start Date & Time', ru: 'Дата и время начала', cz: 'Datum a čas začátku' },
  'visits.endDateTime': { en: 'End Date & Time', ru: 'Дата и время окончания', cz: 'Datum a čas konce' },
  'visits.price': { en: 'Price', ru: 'Цена', cz: 'Cena' },
  'visits.notes': { en: 'Notes', ru: 'Примечания', cz: 'Poznámky' },
  'visits.selectClient': { en: 'Select client...', ru: 'Выберите клиента...', cz: 'Vyberte klienta...' },
  'visits.selectService': { en: 'Select service...', ru: 'Выберите услугу...', cz: 'Vyberte službu...' },
  'visits.createVisit': { en: 'Create Visit', ru: 'Создать визит', cz: 'Vytvořit návštěvu' },
  'visits.updateVisit': { en: 'Update Visit', ru: 'Обновить визит', cz: 'Aktualizovat návštěvu' },
  
  // Calendar
  'calendar.title': { en: 'Calendar', ru: 'Календарь', cz: 'Kalendář' },
  'calendar.simpleViewDescription': { en: 'Click on a date to create a visit, or click on an existing visit to edit it.', ru: 'Нажмите на дату, чтобы создать визит, или нажмите на существующий визит, чтобы отредактировать его.', cz: 'Klikněte na datum pro vytvoření návštěvy nebo klikněte na existující návštěvu pro úpravu.' },
  'calendar.advancedViewDescription': { en: 'Click on a time slot to create a visit, or click on an existing visit to edit it.', ru: 'Нажмите на временной слот, чтобы создать визит, или нажмите на существующий визит, чтобы отредактировать его.', cz: 'Klikněte na časový slot pro vytvoření návštěvy nebo klikněte na existující návštěvu pro úpravu.' },
  'calendar.simpleView': { en: 'Simple View', ru: 'Простой вид', cz: 'Jednoduché zobrazení' },
  'calendar.advancedView': { en: 'Advanced View', ru: 'Расширенный вид', cz: 'Pokročilé zobrazení' },
  'calendar.noVisits': { en: 'No visits on this date', ru: 'Нет визитов на эту дату', cz: 'Na tento den žádné návštěvy' },
  'calendar.visit': { en: 'visit', ru: 'визит', cz: 'návštěva' },
  'calendar.visits': { en: 'visits', ru: 'визитов', cz: 'návštěv' },
  'calendar.backToCalendar': { en: 'Back to Calendar', ru: 'Назад к календарю', cz: 'Zpět do kalendáře' },
  'calendar.previous': { en: 'Previous', ru: 'Назад', cz: 'Předchozí' },
  'calendar.next': { en: 'Next', ru: 'Вперед', cz: 'Další' },
  'calendar.more': { en: 'more', ru: 'еще', cz: 'více' },
  
  // Employees
  'employees.title': { en: 'Employees', ru: 'Сотрудники', cz: 'Zaměstnanci' },
  'employees.add_employee': { en: 'Add Employee', ru: 'Добавить сотрудника', cz: 'Přidat zaměstnance' },
  'employees.search_placeholder': { en: 'Search employees...', ru: 'Поиск сотрудников...', cz: 'Hledat zaměstnance...' },
  'employees.active_only': { en: 'Active only', ru: 'Только активные', cz: 'Pouze aktivní' },
  'employees.employee': { en: 'Employee', ru: 'Сотрудник', cz: 'Zaměstnanec' },
  'employees.position': { en: 'Position', ru: 'Должность', cz: 'Pozice' },
  'employees.commission': { en: 'Commission', ru: 'Комиссия', cz: 'Provize' },
  'employees.base_salary': { en: 'Base Salary', ru: 'Базовая зарплата', cz: 'Základní plat' },
  'employees.status': { en: 'Status', ru: 'Статус', cz: 'Status' },
  'employees.hired_at': { en: 'Hired At', ru: 'Нанят', cz: 'Najato' },
  'employees.actions': { en: 'Actions', ru: 'Действия', cz: 'Akce' },
  'employees.no_employees': { en: 'No employees found', ru: 'Сотрудники не найдены', cz: 'Žádní zaměstnanci nenalezeni' },
  'employees.unknown': { en: 'Unknown', ru: 'Неизвестно', cz: 'Neznámý' },
  'employees.active': { en: 'Active', ru: 'Активен', cz: 'Aktivní' },
  'employees.inactive': { en: 'Inactive', ru: 'Неактивен', cz: 'Neaktivní' },
  'employees.edit_employee': { en: 'Edit Employee', ru: 'Редактировать сотрудника', cz: 'Upravit zaměstnance' },
  'employees.fire': { en: 'Fire', ru: 'Уволить', cz: 'Propustit' },
  'employees.confirm_fire': { en: 'Are you sure you want to fire {name}?', ru: 'Вы уверены, что хотите уволить {name}?', cz: 'Opravdu chcete propustit {name}?' },
  'employees.salary': { en: 'Salary', ru: 'Зарплата', cz: 'Plat' },
  'employees.form_coming_soon': { en: 'Employee management form is coming soon', ru: 'Форма управления сотрудниками скоро появится', cz: 'Formulář pro správu zaměstnanců brzy přijde' },
  'employees.access_denied': { en: 'You do not have permission to view this page', ru: 'У вас нет доступа к этой странице', cz: 'Nemáte oprávnění k zobrazení této stránky' },
  'employees.select_user': { en: 'Select User', ru: 'Выберите пользователя', cz: 'Vyberte uživatele' },
  'employees.select_user_placeholder': { en: 'Select a user...', ru: 'Выберите пользователя...', cz: 'Vyberte uživatele...' },
  'employees.select_user_required': { en: 'Please select a user', ru: 'Пожалуйста, выберите пользователя', cz: 'Prosím vyberte uživatele' },
  'employees.no_available_users': { en: 'No available users found', ru: 'Доступные пользователи не найдены', cz: 'Nebyli nalezeni dostupní uživatelé' },
  'employees.position_placeholder': { en: 'e.g., Massage Therapist, Administrator', ru: 'например, Массажист, Администратор', cz: 'např. Masér, Administrátor' },
  'employees.permissions': { en: 'Permissions', ru: 'Права доступа', cz: 'Oprávnění' },
  'employees.permission_create_visits': { en: 'Can create visits', ru: 'Может создавать визиты', cz: 'Může vytvářet návštěvy' },
  'employees.permission_edit_clients': { en: 'Can edit clients', ru: 'Может редактировать клиентов', cz: 'Může upravovat klienty' },
  'employees.permission_view_financials': { en: 'Can view financial information', ru: 'Может просматривать финансовую информацию', cz: 'Může zobrazovat finanční informace' },
  'employees.permission_manage_services': { en: 'Can manage services', ru: 'Может управлять услугами', cz: 'Může spravovat služby' },
  
  // Salary
  'salary.my_salary': { en: 'My Salary', ru: 'Моя зарплата', cz: 'Můj plat' },
  'salary.current_unpaid': { en: 'Current Unpaid Salary', ru: 'Текущая невыплаченная зарплата', cz: 'Aktuální nevyplacený plat' },
  'salary.unpaid': { en: 'Unpaid', ru: 'Не выплачено', cz: 'Neplaceno' },
  'salary.period': { en: 'Period', ru: 'Период', cz: 'Období' },
  'salary.total_visits': { en: 'Total Visits', ru: 'Всего визитов', cz: 'Celkem návštěv' },
  'salary.completed': { en: 'Completed', ru: 'Завершено', cz: 'Dokončeno' },
  'salary.total': { en: 'Total', ru: 'Всего', cz: 'Celkem' },
  'salary.total_revenue': { en: 'Total Revenue', ru: 'Общий доход', cz: 'Celkový příjem' },
  'salary.total_salary': { en: 'Total Salary', ru: 'Итоговая зарплата', cz: 'Celkový plat' },
  'salary.base': { en: 'Base', ru: 'Базовая', cz: 'Základ' },
  'salary.commission': { en: 'Commission', ru: 'Комиссия', cz: 'Provize' },
  'salary.notes': { en: 'Notes', ru: 'Заметки', cz: 'Poznámky' },
  'salary.calculated_at': { en: 'Calculated at', ru: 'Рассчитано', cz: 'Vypočítáno' },
  'salary.no_unpaid_salary': { en: 'You have no unpaid salary at the moment', ru: 'У вас нет невыплаченной зарплаты', cz: 'Momentálně nemáte nevyplacený plat' },
  'salary.history': { en: 'Salary History', ru: 'История зарплат', cz: 'Historie platů' },
  'salary.visits': { en: 'Visits', ru: 'Визиты', cz: 'Návštěvy' },
  'salary.revenue': { en: 'Revenue', ru: 'Доход', cz: 'Příjem' },
  'salary.salary': { en: 'Salary', ru: 'Зарплата', cz: 'Plat' },
  'salary.status': { en: 'Status', ru: 'Статус', cz: 'Status' },
  'salary.paid_at': { en: 'Paid At', ru: 'Выплачено', cz: 'Vyplaceno' },
  'salary.cancelled': { en: 'cancelled', ru: 'отменено', cz: 'zrušeno' },
  'salary.paid': { en: 'Paid', ru: 'Выплачено', cz: 'Vyplaceno' },
  'salary.access_denied': { en: 'You do not have permission to view this page', ru: 'У вас нет доступа к этой странице', cz: 'Nemáte oprávnění k zobrazení této stránky' },
  'salary.no_history': { en: 'No salary history available', ru: 'История зарплат отсутствует', cz: 'Historie platů není k dispozici' },
  'salary.mark_paid': { en: 'Mark as Paid', ru: 'Отметить как выплаченную', cz: 'Označit jako vyplacenou' },
  'salary.mark_paid_confirm': { en: 'Are you sure you want to mark this salary as paid?', ru: 'Вы уверены, что хотите отметить эту зарплату как выплаченную?', cz: 'Opravdu chcete označit tento plat jako vyplacený?' },
  'salary.calculate_salary': { en: 'Calculate Salary', ru: 'Рассчитать зарплату', cz: 'Vypočítat plat' },
  'salary.calculate_success': { en: 'Salary calculated successfully', ru: 'Зарплата успешно рассчитана', cz: 'Plat byl úspěšně vypočítán' },
  'salary.calculate_error': { en: 'Failed to calculate salary', ru: 'Не удалось рассчитать зарплату', cz: 'Nepodařilo se vypočítat plat' },
  'salary.mark_paid_success': { en: 'Salary marked as paid', ru: 'Зарплата отмечена как выплаченная', cz: 'Plat byl označen jako vyplacený' },
  'salary.mark_paid_error': { en: 'Failed to mark salary as paid', ru: 'Не удалось отметить зарплату как выплаченную', cz: 'Nepodařilo se označit plat jako vyplacený' },
  'salary.view_details': { en: 'View Details', ru: 'Просмотреть детали', cz: 'Zobrazit detaily' },
  'salary.calculated_by': { en: 'Calculated by', ru: 'Рассчитано', cz: 'Vypočítáno' },
  
  // Nav
  'nav.employees': { en: 'Employees', ru: 'Сотрудники', cz: 'Zaměstnanci' },
  'nav.my_salary': { en: 'My Salary', ru: 'Моя зарплата', cz: 'Můj plat' },
  
  // Common
  'common.currency': { en: 'CZK', ru: 'CZK', cz: 'CZK' },
  'common.close': { en: 'Close', ru: 'Закрыть', cz: 'Zavřít' },
}

export default translations

