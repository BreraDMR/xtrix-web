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
  | 'nav.inventory'
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
  | 'dashboard.monthlyProfit'
  | 'dashboard.monthlyExpenses'
  | 'dashboard.profitMargin'
  | 'dashboard.margin'
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
  | 'visits.clientList'
  | 'visits.clientSearch'
  | 'visits.searchClientPlaceholder'
  | 'visits.searching'
  | 'visits.clientFromOtherBusiness'
  | 'visits.addToMyBusiness'
  | 'visits.basicMedicalInfo'
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
  | 'nav.business'
  | 'nav.employees'
  | 'nav.my_salary'
  | 'nav.subscription'
  | 'nav.inventory'
  | 'nav.finance'
  | 'nav.analytics'
  | 'nav.loyalty'
  | 'nav.settings'
  | 'nav.primary'
  | 'nav.manage'
  | 'nav.system'
  // Settings
  | 'settings.title'
  | 'settings.subtitle'
  | 'settings.language'
  | 'settings.language_description'
  | 'settings.currency'
  | 'settings.currency_description'
  | 'settings.currency_eur'
  | 'settings.currency_usd'
  | 'settings.currency_czk'
  | 'settings.currency_rub'
  | 'settings.currency_uah'
  | 'settings.saving'
  | 'settings.saved'
  | 'settings.error_saving'
  | 'settings.theme'
  | 'settings.theme_description'
  | 'settings.theme_light'
  | 'settings.theme_dark'
  | 'settings.theme_system'
  | 'settings.timezone'
  | 'settings.timezone_description'
  | 'settings.date_time_format'
  | 'settings.date_format'
  | 'settings.time_format'
  | 'settings.notifications'
  | 'settings.email_notifications'
  | 'settings.email_notifications_description'
  | 'settings.push_notifications'
  | 'settings.push_notifications_description'
  | 'settings.auto_save'
  | 'settings.auto_save_enabled'
  | 'settings.auto_save_description'
  | 'settings.auto_save_interval'
  | 'settings.seconds'
  | 'settings.export_format'
  | 'settings.export_format_description'
  // Finance
  | 'finance.title'
  | 'finance.subtitle'
  | 'finance.revenue'
  | 'finance.expenses'
  | 'finance.profit'
  | 'finance.profit_margin'
  | 'finance.date_from'
  | 'finance.date_to'
  | 'finance.category'
  | 'finance.all_categories'
  | 'finance.add_expense'
  | 'finance.expenses_by_category'
  | 'finance.expenses_list'
  | 'finance.no_expenses'
  | 'finance.date'
  | 'finance.description'
  | 'finance.amount'
  | 'finance.payment_method'
  | 'finance.actions'
  | 'finance.confirm_delete'
  | 'finance.form_coming_soon'
  | 'finance.currency'
  | 'finance.no_category'
  | 'finance.amount_required'
  | 'finance.date_required'
  | 'finance.description_placeholder'
  | 'finance.payment_cash'
  | 'finance.payment_card'
  | 'finance.payment_transfer'
  | 'finance.payment_other'
  // Subscription
  | 'subscription.title'
  | 'subscription.notRequired'
  | 'subscription.employeeMessage'
  | 'subscription.currentSubscription'
  | 'subscription.trialActive'
  | 'subscription.trialEnds'
  | 'subscription.availablePlans'
  | 'subscription.currentPlan'
  | 'subscription.subscribe'
  | 'subscription.noSubscription'
  | 'subscription.selectPlan'
  | 'subscription.noPlansAvailable'
  | 'subscription.contactAdmin'
  | 'subscription.cancel'
  | 'subscription.cancelled'
  | 'subscription.reactivate'
  | 'subscription.pendingCancellation'
  | 'subscription.transactionHistory'
  | 'subscription.history'
  // Inventory
  | 'inventory.title'
  | 'inventory.add_product'
  | 'inventory.edit_product'
  | 'inventory.name'
  | 'inventory.description'
  | 'inventory.category'
  | 'inventory.quantity'
  | 'inventory.min_quantity'
  | 'inventory.unit'
  | 'inventory.price'
  | 'inventory.barcode'
  | 'inventory.supplier'
  | 'inventory.location'
  | 'inventory.actions'
  | 'inventory.edit'
  | 'inventory.delete'
  | 'inventory.add_quantity'
  | 'inventory.add_quantity_to'
  | 'inventory.low_stock'
  | 'inventory.low_stock_warning'
  | 'inventory.low_stock_description'
  | 'inventory.low_stock_only'
  | 'inventory.search_placeholder'
  | 'inventory.no_products'
  // Analytics
  | 'analytics.title'
  | 'analytics.subtitle'
  | 'analytics.retention'
  | 'analytics.cohorts'
  | 'analytics.trends'
  | 'analytics.forecast'
  | 'analytics.services_specialists'
  | 'analytics.insights'
  | 'analytics.benchmarks'
  | 'analytics.retention_7_days'
  | 'analytics.retention_30_days'
  | 'analytics.retention_90_days'
  | 'analytics.repeat_rate'
  | 'analytics.avg_days_between_visits'
  | 'analytics.total_clients'
  | 'analytics.repeat_clients'
  | 'analytics.cohort_month'
  | 'analytics.trend_metric'
  | 'analytics.trend_comparison'
  | 'analytics.current_value'
  | 'analytics.previous_value'
  | 'analytics.change'
  | 'analytics.change_percent'
  | 'analytics.trend_up'
  | 'analytics.trend_down'
  | 'analytics.trend_stable'
  | 'analytics.forecast_type'
  | 'analytics.forecast_periods'
  | 'analytics.historical_average'
  | 'analytics.last_value'
  | 'analytics.service_name'
  | 'analytics.visit_count'
  | 'analytics.total_revenue'
  | 'analytics.avg_price'
  | 'analytics.unique_clients'
  | 'analytics.ltv_per_client'
  | 'analytics.visits_per_client'
  | 'analytics.specialist_name'
  | 'analytics.avg_check'
  | 'analytics.revenue_per_client'
  | 'analytics.insight_type_info'
  | 'analytics.insight_type_warning'
  | 'analytics.insight_type_success'
  | 'analytics.insight_priority_low'
  | 'analytics.insight_priority_medium'
  | 'analytics.insight_priority_high'
  | 'analytics.benchmarks_available'
  | 'analytics.benchmarks_not_available'
  | 'analytics.business_count'
  | 'analytics.avg_check_benchmark'
  | 'analytics.avg_visits_per_client'
  | 'analytics.avg_retention_rate'
  | 'analytics.avg_daily_load'
  | 'analytics.no_data'
  | 'analytics.loading'
  | 'analytics.date_from'
  | 'analytics.date_to'
  | 'analytics.metric_revenue'
  | 'analytics.metric_clients'
  | 'analytics.metric_visits'
  | 'analytics.metric_average_check'
  | 'analytics.metric_load'
  | 'analytics.comparison_mom'
  | 'analytics.comparison_wow'
  | 'analytics.comparison_yoy'
  | 'analytics.forecast_revenue'
  | 'analytics.forecast_visits'
  // Loyalty
  | 'loyalty.title'
  | 'loyalty.subtitle'
  | 'loyalty.program_settings'
  | 'loyalty.levels'
  | 'loyalty.promotions'
  | 'loyalty.transactions'
  | 'loyalty.program_type'
  | 'loyalty.program_points'
  | 'loyalty.program_cashback'
  | 'loyalty.program_hybrid'
  | 'loyalty.points_per_currency'
  | 'loyalty.points_name'
  | 'loyalty.currency_per_point'
  | 'loyalty.cashback_percent'
  | 'loyalty.use_levels'
  | 'loyalty.points_expiry_days'
  | 'loyalty.birthday_bonus_enabled'
  | 'loyalty.birthday_bonus_points'
  | 'loyalty.birthday_bonus_percent'
  | 'loyalty.max_bonus_payment_percent'
  | 'loyalty.is_active'
  | 'loyalty.create_program'
  | 'loyalty.edit_program'
  | 'loyalty.delete_program'
  | 'loyalty.add_level'
  | 'loyalty.edit_level'
  | 'loyalty.level_name'
  | 'loyalty.level_number'
  | 'loyalty.min_spending'
  | 'loyalty.points_multiplier'
  | 'loyalty.cashback_multiplier'
  | 'loyalty.benefits'
  | 'loyalty.color'
  | 'loyalty.add_promotion'
  | 'loyalty.edit_promotion'
  | 'loyalty.promotion_name'
  | 'loyalty.promotion_type'
  | 'loyalty.promotion_double_points'
  | 'loyalty.promotion_extra_cashback'
  | 'loyalty.promotion_bonus_points'
  | 'loyalty.promotion_discount'
  | 'loyalty.bonus_points'
  | 'loyalty.discount_percent'
  | 'loyalty.start_date'
  | 'loyalty.end_date'
  | 'loyalty.min_amount'
  | 'loyalty.for_all_clients'
  | 'loyalty.for_specific_client'
  | 'loyalty.client_balance'
  | 'loyalty.points'
  | 'loyalty.cashback'
  | 'loyalty.current_level'
  | 'loyalty.transaction_history'
  | 'loyalty.transaction_type'
  | 'loyalty.transaction_earned'
  | 'loyalty.transaction_spent'
  | 'loyalty.transaction_birthday'
  | 'loyalty.transaction_level_up'
  | 'loyalty.use_points'
  | 'loyalty.points_to_use'
  | 'loyalty.cashback_to_use'
  | 'loyalty.discount_amount'
  | 'loyalty.no_program'
  | 'loyalty.program_not_active'
  | 'loyalty.activate_program'
  | 'loyalty.deactivate_program'
  | 'loyalty.no_levels'
  | 'loyalty.no_promotions'
  | 'loyalty.no_transactions'
  | 'loyalty.service_ids'
  | 'loyalty.service_ids_placeholder'
  // Common
  | 'common.currency'
  | 'common.close'
  | 'common.days'
  | 'common.actions'

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
  'dashboard.monthlyProfit': { en: 'Monthly Profit', ru: 'Месячная прибыль', cz: 'Měsíční zisk' },
  'dashboard.monthlyExpenses': { en: 'Monthly Expenses', ru: 'Месячные расходы', cz: 'Měsíční výdaje' },
  'dashboard.profitMargin': { en: 'Profit Margin', ru: 'Рентабельность', cz: 'Zisková marže' },
  'dashboard.margin': { en: 'Margin', ru: 'Маржа', cz: 'Marže' },
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
  'nav.business': { en: 'Business', ru: 'Бизнес', cz: 'Podnikání' },
  'nav.employees': { en: 'Employees', ru: 'Сотрудники', cz: 'Zaměstnanci' },
  'nav.my_salary': { en: 'My Salary', ru: 'Моя зарплата', cz: 'Můj plat' },
  'nav.subscription': { en: 'Billing', ru: 'Биллинг', cz: 'Fakturace' },
  'nav.inventory': { en: 'Products', ru: 'Продукты', cz: 'Produkty' },
  'nav.finance': { en: 'Payments', ru: 'Платежи', cz: 'Platby' },
  'nav.analytics': { en: 'Analytics', ru: 'Аналитика', cz: 'Analytika' },
  'nav.loyalty': { en: 'Loyalty', ru: 'Лояльность', cz: 'Věrnost' },
  'nav.settings': { en: 'Settings', ru: 'Настройки', cz: 'Nastavení' },
  'nav.primary': { en: 'PRIMARY', ru: 'ОСНОВНОЕ', cz: 'ZÁKLADNÍ' },
  'nav.manage': { en: 'MANAGE', ru: 'УПРАВЛЕНИЕ', cz: 'SPRÁVA' },
  'nav.system': { en: 'SYSTEM', ru: 'СИСТЕМА', cz: 'SYSTÉM' },
  
  // Settings
  'settings.title': { en: 'Settings', ru: 'Настройки', cz: 'Nastavení' },
  'settings.subtitle': { en: 'Manage your account preferences', ru: 'Управляйте настройками аккаунта', cz: 'Spravujte nastavení účtu' },
  'settings.language': { en: 'Language', ru: 'Язык', cz: 'Jazyk' },
  'settings.language_description': { en: 'Select your preferred language for the interface', ru: 'Выберите предпочитаемый язык интерфейса', cz: 'Vyberte preferovaný jazyk rozhraní' },
  'settings.currency': { en: 'Currency', ru: 'Валюта', cz: 'Měna' },
  'settings.currency_description': { en: 'Select the currency for displaying amounts throughout the application', ru: 'Выберите валюту для отображения сумм во всем приложении', cz: 'Vyberte měnu pro zobrazení částek v celé aplikaci' },
  'settings.currency_eur': { en: 'Euro', ru: 'Евро', cz: 'Euro' },
  'settings.currency_usd': { en: 'US Dollar', ru: 'Доллар США', cz: 'Americký dolar' },
  'settings.currency_czk': { en: 'Czech Koruna', ru: 'Чешская крона', cz: 'Česká koruna' },
  'settings.currency_rub': { en: 'Russian Ruble', ru: 'Российский рубль', cz: 'Ruský rubl' },
  'settings.currency_uah': { en: 'Ukrainian Hryvnia', ru: 'Украинская гривна', cz: 'Ukrajinská hřivna' },
  'settings.saving': { en: 'Saving...', ru: 'Сохранение...', cz: 'Ukládání...' },
  'settings.saved': { en: 'Settings saved successfully', ru: 'Настройки успешно сохранены', cz: 'Nastavení úspěšně uloženo' },
  'settings.error_saving': { en: 'Error saving settings', ru: 'Ошибка при сохранении настроек', cz: 'Chyba při ukládání nastavení' },
  'settings.theme': { en: 'Theme', ru: 'Тема оформления', cz: 'Téma' },
  'settings.theme_description': { en: 'Select the appearance theme', ru: 'Выберите тему оформления', cz: 'Vyberte téma vzhledu' },
  'settings.theme_light': { en: 'Light', ru: 'Светлая', cz: 'Světlá' },
  'settings.theme_dark': { en: 'Dark', ru: 'Тёмная', cz: 'Tmavá' },
  'settings.theme_system': { en: 'System', ru: 'Системная', cz: 'Systémová' },
  'settings.timezone': { en: 'Timezone', ru: 'Часовой пояс', cz: 'Časové pásmo' },
  'settings.timezone_description': { en: 'Select your timezone for displaying dates and times', ru: 'Выберите часовой пояс для отображения дат и времени', cz: 'Vyberte časové pásmo pro zobrazení dat a času' },
  'settings.date_time_format': { en: 'Date and Time Format', ru: 'Формат даты и времени', cz: 'Formát data a času' },
  'settings.date_format': { en: 'Date Format', ru: 'Формат даты', cz: 'Formát data' },
  'settings.time_format': { en: 'Time Format', ru: 'Формат времени', cz: 'Formát času' },
  'settings.notifications': { en: 'Notifications', ru: 'Уведомления', cz: 'Oznámení' },
  'settings.email_notifications': { en: 'Email Notifications', ru: 'Email уведомления', cz: 'E-mailová oznámení' },
  'settings.email_notifications_description': { en: 'Receive notifications via email', ru: 'Получать уведомления по электронной почте', cz: 'Přijímat oznámení e-mailem' },
  'settings.push_notifications': { en: 'Push Notifications', ru: 'Push уведомления', cz: 'Push oznámení' },
  'settings.push_notifications_description': { en: 'Receive push notifications in browser', ru: 'Получать push уведомления в браузере', cz: 'Přijímat push oznámení v prohlížeči' },
  'settings.auto_save': { en: 'Auto-save', ru: 'Автосохранение', cz: 'Automatické ukládání' },
  'settings.auto_save_enabled': { en: 'Enable Auto-save', ru: 'Включить автосохранение', cz: 'Povolit automatické ukládání' },
  'settings.auto_save_description': { en: 'Automatically save form data while editing', ru: 'Автоматически сохранять данные форм при редактировании', cz: 'Automaticky ukládat data formulářů při úpravách' },
  'settings.auto_save_interval': { en: 'Auto-save Interval', ru: 'Интервал автосохранения', cz: 'Interval automatického ukládání' },
  'settings.seconds': { en: 'seconds', ru: 'секунд', cz: 'sekund' },
  'settings.export_format': { en: 'Export Format', ru: 'Формат экспорта', cz: 'Formát exportu' },
  'settings.export_format_description': { en: 'Default format for exporting data', ru: 'Формат по умолчанию для экспорта данных', cz: 'Výchozí formát pro export dat' },
  
  // Inventory
  'inventory.title': { en: 'Inventory Management', ru: 'Управление складом', cz: 'Správa skladu' },
  'inventory.add_product': { en: 'Add Product', ru: 'Добавить товар', cz: 'Přidat produkt' },
  'inventory.edit_product': { en: 'Edit Product', ru: 'Редактировать товар', cz: 'Upravit produkt' },
  'inventory.name': { en: 'Name', ru: 'Название', cz: 'Název' },
  'inventory.description': { en: 'Description', ru: 'Описание', cz: 'Popis' },
  'inventory.category': { en: 'Category', ru: 'Категория', cz: 'Kategorie' },
  'inventory.quantity': { en: 'Quantity', ru: 'Количество', cz: 'Množství' },
  'inventory.min_quantity': { en: 'Min Quantity', ru: 'Мин. количество', cz: 'Min. množství' },
  'inventory.unit': { en: 'Unit', ru: 'Единица', cz: 'Jednotka' },
  'inventory.price': { en: 'Price', ru: 'Цена', cz: 'Cena' },
  'inventory.barcode': { en: 'Barcode', ru: 'Штрихкод', cz: 'Čárový kód' },
  'inventory.supplier': { en: 'Supplier', ru: 'Поставщик', cz: 'Dodavatel' },
  'inventory.location': { en: 'Location', ru: 'Место хранения', cz: 'Umístění' },
  'inventory.actions': { en: 'Actions', ru: 'Действия', cz: 'Akce' },
  'inventory.edit': { en: 'Edit', ru: 'Редактировать', cz: 'Upravit' },
  'inventory.delete': { en: 'Delete', ru: 'Удалить', cz: 'Smazat' },
  'inventory.add_quantity': { en: 'Add Quantity', ru: 'Добавить количество', cz: 'Přidat množství' },
  'inventory.add_quantity_to': { en: 'Add Quantity to', ru: 'Добавить количество в', cz: 'Přidat množství do' },
  'inventory.low_stock': { en: 'Low Stock', ru: 'Низкий остаток', cz: 'Nízký stav' },
  'inventory.low_stock_warning': { en: 'Low Stock Warning: {count} product(s) need restocking', ru: 'Предупреждение: {count} товар(ов) нуждается в пополнении', cz: 'Varování: {count} produktů potřebuje doplnění' },
  'inventory.low_stock_description': { en: 'Some products are running low. Please restock to avoid shortages.', ru: 'Некоторые товары заканчиваются. Пожалуйста, пополните склад.', cz: 'Některé produkty docházejí. Prosím doplňte sklad.' },
  'inventory.low_stock_only': { en: 'Low Stock Only', ru: 'Только низкий остаток', cz: 'Pouze nízký stav' },
  'inventory.search_placeholder': { en: 'Search products...', ru: 'Поиск товаров...', cz: 'Hledat produkty...' },
  'inventory.no_products': { en: 'No products found', ru: 'Товары не найдены', cz: 'Produkty nenalezeny' },
  
  // Analytics
  'analytics.title': { en: 'Analytics', ru: 'Аналитика', cz: 'Analytika' },
  'analytics.subtitle': { en: 'Advanced analytics and insights for your business', ru: 'Расширенная аналитика и инсайты для вашего бизнеса', cz: 'Pokročilá analytika a poznatky pro váš podnik' },
  'analytics.retention': { en: 'Retention', ru: 'Удержание', cz: 'Retence' },
  'analytics.cohorts': { en: 'Cohorts', ru: 'Когорты', cz: 'Kohorty' },
  'analytics.trends': { en: 'Trends', ru: 'Тренды', cz: 'Trendy' },
  'analytics.forecast': { en: 'Forecast', ru: 'Прогноз', cz: 'Předpověď' },
  'analytics.services_specialists': { en: 'Services & Specialists', ru: 'Услуги и мастера', cz: 'Služby a specialisté' },
  'analytics.insights': { en: 'Insights', ru: 'Инсайты', cz: 'Poznatky' },
  'analytics.benchmarks': { en: 'Benchmarks', ru: 'Бенчмарки', cz: 'Srovnávací hodnoty' },
  'analytics.retention_7_days': { en: '7-Day Retention', ru: 'Удержание за 7 дней', cz: '7denní retence' },
  'analytics.retention_30_days': { en: '30-Day Retention', ru: 'Удержание за 30 дней', cz: '30denní retence' },
  'analytics.retention_90_days': { en: '90-Day Retention', ru: 'Удержание за 90 дней', cz: '90denní retence' },
  'analytics.repeat_rate': { en: 'Repeat Rate', ru: 'Процент повторных клиентов', cz: 'Míra opakování' },
  'analytics.avg_days_between_visits': { en: 'Avg Days Between Visits', ru: 'Среднее дней между визитами', cz: 'Průměr dní mezi návštěvami' },
  'analytics.total_clients': { en: 'Total Clients', ru: 'Всего клиентов', cz: 'Celkem klientů' },
  'analytics.repeat_clients': { en: 'Repeat Clients', ru: 'Повторные клиенты', cz: 'Opakující se klienti' },
  'analytics.cohort_month': { en: 'Cohort Month', ru: 'Месяц когорты', cz: 'Měsíc kohorty' },
  'analytics.trend_metric': { en: 'Metric', ru: 'Метрика', cz: 'Metrika' },
  'analytics.trend_comparison': { en: 'Comparison', ru: 'Сравнение', cz: 'Porovnání' },
  'analytics.current_value': { en: 'Current', ru: 'Текущее', cz: 'Aktuální' },
  'analytics.previous_value': { en: 'Previous', ru: 'Предыдущее', cz: 'Předchozí' },
  'analytics.change': { en: 'Change', ru: 'Изменение', cz: 'Změna' },
  'analytics.change_percent': { en: 'Change %', ru: 'Изменение %', cz: 'Změna %' },
  'analytics.trend_up': { en: 'Up', ru: 'Вверх', cz: 'Nahoru' },
  'analytics.trend_down': { en: 'Down', ru: 'Вниз', cz: 'Dolů' },
  'analytics.trend_stable': { en: 'Stable', ru: 'Стабильно', cz: 'Stabilní' },
  'analytics.forecast_type': { en: 'Forecast Type', ru: 'Тип прогноза', cz: 'Typ předpovědi' },
  'analytics.forecast_periods': { en: 'Periods', ru: 'Периоды', cz: 'Období' },
  'analytics.historical_average': { en: 'Historical Average', ru: 'Историческое среднее', cz: 'Historický průměr' },
  'analytics.last_value': { en: 'Last Value', ru: 'Последнее значение', cz: 'Poslední hodnota' },
  'analytics.service_name': { en: 'Service', ru: 'Услуга', cz: 'Služba' },
  'analytics.visit_count': { en: 'Visits', ru: 'Визиты', cz: 'Návštěvy' },
  'analytics.total_revenue': { en: 'Total Revenue', ru: 'Общая выручка', cz: 'Celkový příjem' },
  'analytics.avg_price': { en: 'Avg Price', ru: 'Средняя цена', cz: 'Průměrná cena' },
  'analytics.unique_clients': { en: 'Unique Clients', ru: 'Уникальные клиенты', cz: 'Unikátní klienti' },
  'analytics.ltv_per_client': { en: 'LTV per Client', ru: 'LTV на клиента', cz: 'LTV na klienta' },
  'analytics.visits_per_client': { en: 'Visits per Client', ru: 'Визиты на клиента', cz: 'Návštěvy na klienta' },
  'analytics.specialist_name': { en: 'Specialist', ru: 'Мастер', cz: 'Specialista' },
  'analytics.avg_check': { en: 'Avg Check', ru: 'Средний чек', cz: 'Průměrný šek' },
  'analytics.revenue_per_client': { en: 'Revenue per Client', ru: 'Выручка на клиента', cz: 'Příjem na klienta' },
  'analytics.insight_type_info': { en: 'Info', ru: 'Информация', cz: 'Informace' },
  'analytics.insight_type_warning': { en: 'Warning', ru: 'Предупреждение', cz: 'Varování' },
  'analytics.insight_type_success': { en: 'Success', ru: 'Успех', cz: 'Úspěch' },
  'analytics.insight_priority_low': { en: 'Low', ru: 'Низкий', cz: 'Nízký' },
  'analytics.insight_priority_medium': { en: 'Medium', ru: 'Средний', cz: 'Střední' },
  'analytics.insight_priority_high': { en: 'High', ru: 'Высокий', cz: 'Vysoký' },
  'analytics.benchmarks_available': { en: 'Benchmarks Available', ru: 'Бенчмарки доступны', cz: 'Srovnávací hodnoty dostupné' },
  'analytics.benchmarks_not_available': { en: 'Not enough data for benchmarks', ru: 'Недостаточно данных для бенчмарков', cz: 'Nedostatek dat pro srovnávací hodnoty' },
  'analytics.business_count': { en: 'Businesses Analyzed', ru: 'Бизнесов проанализировано', cz: 'Analyzovaných podniků' },
  'analytics.avg_check_benchmark': { en: 'Avg Check', ru: 'Средний чек', cz: 'Průměrný šek' },
  'analytics.avg_visits_per_client': { en: 'Avg Visits per Client', ru: 'Среднее визитов на клиента', cz: 'Průměr návštěv na klienta' },
  'analytics.avg_retention_rate': { en: 'Avg Retention Rate', ru: 'Средняя удерживаемость', cz: 'Průměrná retence' },
  'analytics.avg_daily_load': { en: 'Avg Daily Load', ru: 'Средняя дневная загрузка', cz: 'Průměrné denní zatížení' },
  'analytics.no_data': { en: 'No data available', ru: 'Нет данных', cz: 'Žádná data' },
  'analytics.loading': { en: 'Loading...', ru: 'Загрузка...', cz: 'Načítání...' },
  'analytics.date_from': { en: 'Date From', ru: 'Дата от', cz: 'Datum od' },
  'analytics.date_to': { en: 'Date To', ru: 'Дата до', cz: 'Datum do' },
  'analytics.metric_revenue': { en: 'Revenue', ru: 'Выручка', cz: 'Příjem' },
  'analytics.metric_clients': { en: 'Clients', ru: 'Клиенты', cz: 'Klienti' },
  'analytics.metric_visits': { en: 'Visits', ru: 'Визиты', cz: 'Návštěvy' },
  'analytics.metric_average_check': { en: 'Average Check', ru: 'Средний чек', cz: 'Průměrný šek' },
  'analytics.metric_load': { en: 'Load', ru: 'Загрузка', cz: 'Zatížení' },
  'analytics.comparison_mom': { en: 'Month over Month', ru: 'Месяц к месяцу', cz: 'Měsíc k měsíci' },
  'analytics.comparison_wow': { en: 'Week over Week', ru: 'Неделя к неделе', cz: 'Týden k týdnu' },
  'analytics.comparison_yoy': { en: 'Year over Year', ru: 'Год к году', cz: 'Rok k roku' },
  'analytics.forecast_revenue': { en: 'Revenue', ru: 'Выручка', cz: 'Příjem' },
  'analytics.forecast_visits': { en: 'Visits', ru: 'Визиты', cz: 'Návštěvy' },
  
  // Finance
  'finance.title': { en: 'Financial Reports', ru: 'Финансовая отчетность', cz: 'Finanční zprávy' },
  'finance.subtitle': { en: 'Revenue, expenses, and profit analysis', ru: 'Анализ доходов, расходов и прибыли', cz: 'Analýza příjmů, výdajů a zisku' },
  'finance.revenue': { en: 'Revenue', ru: 'Доходы', cz: 'Příjmy' },
  'finance.expenses': { en: 'Expenses', ru: 'Расходы', cz: 'Výdaje' },
  'finance.profit': { en: 'Profit', ru: 'Прибыль', cz: 'Zisk' },
  'finance.profit_margin': { en: 'Profit Margin', ru: 'Рентабельность', cz: 'Zisková marže' },
  'finance.date_from': { en: 'Date From', ru: 'Дата от', cz: 'Datum od' },
  'finance.date_to': { en: 'Date To', ru: 'Дата до', cz: 'Datum do' },
  'finance.category': { en: 'Category', ru: 'Категория', cz: 'Kategorie' },
  'finance.all_categories': { en: 'All Categories', ru: 'Все категории', cz: 'Všechny kategorie' },
  'finance.add_expense': { en: 'Add Expense', ru: 'Добавить расход', cz: 'Přidat výdaj' },
  'finance.expenses_by_category': { en: 'Expenses by Category', ru: 'Расходы по категориям', cz: 'Výdaje podle kategorií' },
  'finance.expenses_list': { en: 'Expenses List', ru: 'Список расходов', cz: 'Seznam výdajů' },
  'finance.no_expenses': { en: 'No expenses found', ru: 'Расходы не найдены', cz: 'Výdaje nenalezeny' },
  'finance.date': { en: 'Date', ru: 'Дата', cz: 'Datum' },
  'finance.description': { en: 'Description', ru: 'Описание', cz: 'Popis' },
  'finance.amount': { en: 'Amount', ru: 'Сумма', cz: 'Částka' },
  'finance.payment_method': { en: 'Payment Method', ru: 'Способ оплаты', cz: 'Způsob platby' },
  'finance.actions': { en: 'Actions', ru: 'Действия', cz: 'Akce' },
  'finance.confirm_delete': { en: 'Are you sure you want to delete this expense?', ru: 'Вы уверены, что хотите удалить этот расход?', cz: 'Opravdu chcete smazat tento výdaj?' },
  'finance.form_coming_soon': { en: 'Expense form is coming soon', ru: 'Форма добавления расхода скоро появится', cz: 'Formulář pro přidání výdaje brzy přijde' },
  'finance.currency': { en: 'Currency', ru: 'Валюта', cz: 'Měna' },
  'finance.no_category': { en: 'No Category', ru: 'Без категории', cz: 'Bez kategorie' },
  'finance.amount_required': { en: 'Amount is required and must be greater than 0', ru: 'Сумма обязательна и должна быть больше 0', cz: 'Částka je povinná a musí být větší než 0' },
  'finance.date_required': { en: 'Date is required', ru: 'Дата обязательна', cz: 'Datum je povinné' },
  'finance.description_placeholder': { en: 'Enter expense description (optional)', ru: 'Введите описание расхода (необязательно)', cz: 'Zadejte popis výdaje (volitelné)' },
  'finance.payment_cash': { en: 'Cash', ru: 'Наличные', cz: 'Hotovost' },
  'finance.payment_card': { en: 'Card', ru: 'Карта', cz: 'Karta' },
  'finance.payment_transfer': { en: 'Bank Transfer', ru: 'Банковский перевод', cz: 'Bankovní převod' },
  'finance.payment_other': { en: 'Other', ru: 'Прочее', cz: 'Jiné' },
  
  // Subscription
  'subscription.title': { en: 'Subscription Management', ru: 'Управление подпиской', cz: 'Správa předplatného' },
  'subscription.notRequired': { en: 'Subscription is not required for your role', ru: 'Подписка не требуется для вашей роли', cz: 'Předplatné není vyžadováno pro vaši roli' },
  'subscription.employeeMessage': { en: 'You are using the subscription provided by your administrator. No payment required.', ru: 'Вы используете подписку, предоставленную вашим администратором. Оплата не требуется.', cz: 'Používáte předplatné poskytnuté vaším správcem. Platba není vyžadována.' },
  'subscription.currentSubscription': { en: 'Current Subscription', ru: 'Текущая подписка', cz: 'Aktuální předplatné' },
  'subscription.trialActive': { en: 'Trial period is active', ru: 'Пробный период активен', cz: 'Zkušební období je aktivní' },
  'subscription.trialEnds': { en: 'Trial ends', ru: 'Пробный период заканчивается', cz: 'Zkušební období končí' },
  'subscription.availablePlans': { en: 'Available Plans', ru: 'Доступные планы', cz: 'Dostupné plány' },
  'subscription.currentPlan': { en: 'Current Plan', ru: 'Текущий план', cz: 'Aktuální plán' },
  'subscription.subscribe': { en: 'Subscribe', ru: 'Подписаться', cz: 'Přihlásit se' },
  'subscription.noSubscription': { en: 'No active subscription', ru: 'Нет активной подписки', cz: 'Žádné aktivní předplatné' },
  'subscription.selectPlan': { en: 'Please select a plan above to subscribe', ru: 'Пожалуйста, выберите план выше для подписки', cz: 'Vyberte prosím plán výše pro předplatné' },
  'subscription.noPlansAvailable': { en: 'No subscription plans available for your role', ru: 'Нет доступных планов для вашей роли', cz: 'Žádné dostupné plány pro vaši roli' },
  'subscription.contactAdmin': { en: 'Please contact administrator to create subscription plans', ru: 'Обратитесь к администратору для создания планов подписки', cz: 'Kontaktujte správce pro vytvoření plánů předplatného' },
  'subscription.cancel': { en: 'Cancel Subscription', ru: 'Отменить подписку', cz: 'Zrušit předplatné' },
  'subscription.cancelled': { en: 'Cancelled', ru: 'Отменена', cz: 'Zrušeno' },
  'subscription.reactivate': { en: 'Reactivate', ru: 'Возобновить', cz: 'Obnovit' },
  'subscription.pendingCancellation': { en: 'Pending Cancellation', ru: 'Ожидает отмены', cz: 'Čeká na zrušení' },
  'subscription.transactionHistory': { en: 'Transaction History', ru: 'История транзакций', cz: 'Historie transakcí' },
  'subscription.history': { en: 'Subscription History', ru: 'История подписок', cz: 'Historie předplatného' },
  
  // Loyalty
  'loyalty.title': { en: 'Loyalty Program', ru: 'Программа лояльности', cz: 'Věrnostní program' },
  'loyalty.subtitle': { en: 'Manage loyalty program, levels, and promotions', ru: 'Управление программой лояльности, уровнями и акциями', cz: 'Správa věrnostního programu, úrovní a akcí' },
  'loyalty.program_settings': { en: 'Program Settings', ru: 'Настройки программы', cz: 'Nastavení programu' },
  'loyalty.levels': { en: 'Loyalty Levels', ru: 'Уровни лояльности', cz: 'Úrovně věrnosti' },
  'loyalty.promotions': { en: 'Promotions', ru: 'Акции', cz: 'Akce' },
  'loyalty.transactions': { en: 'Transactions', ru: 'Транзакции', cz: 'Transakce' },
  'loyalty.program_type': { en: 'Program Type', ru: 'Тип программы', cz: 'Typ programu' },
  'loyalty.program_points': { en: 'Points', ru: 'Баллы', cz: 'Body' },
  'loyalty.program_cashback': { en: 'Cashback', ru: 'Кэшбэк', cz: 'Cashback' },
  'loyalty.program_hybrid': { en: 'Hybrid (Points + Cashback)', ru: 'Гибрид (Баллы + Кэшбэк)', cz: 'Hybrid (Body + Cashback)' },
  'loyalty.points_per_currency': { en: 'Points per Currency Unit', ru: 'Баллов за единицу валюты', cz: 'Bodů za jednotku měny' },
  'loyalty.points_name': { en: 'Points Name', ru: 'Название баллов', cz: 'Název bodů' },
  'loyalty.currency_per_point': { en: 'Currency per Point', ru: 'Валюта за балл', cz: 'Měna za bod' },
  'loyalty.cashback_percent': { en: 'Cashback Percentage', ru: 'Процент кэшбэка', cz: 'Procento cashbacku' },
  'loyalty.use_levels': { en: 'Use Levels', ru: 'Использовать уровни', cz: 'Použít úrovně' },
  'loyalty.points_expiry_days': { en: 'Points Expiry (days)', ru: 'Срок действия баллов (дней)', cz: 'Platnost bodů (dny)' },
  'loyalty.birthday_bonus_enabled': { en: 'Enable Birthday Bonus', ru: 'Включить бонус ко дню рождения', cz: 'Povolit narozeninový bonus' },
  'loyalty.birthday_bonus_points': { en: 'Birthday Bonus Points', ru: 'Бонусные баллы ко дню рождения', cz: 'Narozeninové bonusové body' },
  'loyalty.birthday_bonus_percent': { en: 'Birthday Bonus Cashback %', ru: 'Бонусный кэшбэк ко дню рождения %', cz: 'Narozeninový cashback %' },
  'loyalty.max_bonus_payment_percent': { en: 'Max Bonus Payment %', ru: 'Макс. % оплаты бонусами', cz: 'Max. % platby bonusy' },
  'loyalty.is_active': { en: 'Active', ru: 'Активна', cz: 'Aktivní' },
  'loyalty.create_program': { en: 'Create Program', ru: 'Создать программу', cz: 'Vytvořit program' },
  'loyalty.edit_program': { en: 'Edit Program', ru: 'Редактировать программу', cz: 'Upravit program' },
  'loyalty.delete_program': { en: 'Delete Program', ru: 'Удалить программу', cz: 'Smazat program' },
  'loyalty.add_level': { en: 'Add Level', ru: 'Добавить уровень', cz: 'Přidat úroveň' },
  'loyalty.edit_level': { en: 'Edit Level', ru: 'Редактировать уровень', cz: 'Upravit úroveň' },
  'loyalty.level_name': { en: 'Level Name', ru: 'Название уровня', cz: 'Název úrovně' },
  'loyalty.level_number': { en: 'Level Number', ru: 'Номер уровня', cz: 'Číslo úrovně' },
  'loyalty.min_spending': { en: 'Minimum Spending', ru: 'Минимальные траты', cz: 'Minimální výdaje' },
  'loyalty.points_multiplier': { en: 'Points Multiplier', ru: 'Множитель баллов', cz: 'Násobitel bodů' },
  'loyalty.cashback_multiplier': { en: 'Cashback Multiplier', ru: 'Множитель кэшбэка', cz: 'Násobitel cashbacku' },
  'loyalty.benefits': { en: 'Benefits', ru: 'Привилегии', cz: 'Výhody' },
  'loyalty.color': { en: 'Color', ru: 'Цвет', cz: 'Barva' },
  'loyalty.add_promotion': { en: 'Add Promotion', ru: 'Добавить акцию', cz: 'Přidat akci' },
  'loyalty.edit_promotion': { en: 'Edit Promotion', ru: 'Редактировать акцию', cz: 'Upravit akci' },
  'loyalty.promotion_name': { en: 'Promotion Name', ru: 'Название акции', cz: 'Název akce' },
  'loyalty.promotion_type': { en: 'Promotion Type', ru: 'Тип акции', cz: 'Typ akce' },
  'loyalty.promotion_double_points': { en: 'Double Points', ru: 'Двойные баллы', cz: 'Dvojité body' },
  'loyalty.promotion_extra_cashback': { en: 'Extra Cashback', ru: 'Дополнительный кэшбэк', cz: 'Extra cashback' },
  'loyalty.promotion_bonus_points': { en: 'Bonus Points', ru: 'Бонусные баллы', cz: 'Bonusové body' },
  'loyalty.promotion_discount': { en: 'Discount', ru: 'Скидка', cz: 'Sleva' },
  'loyalty.bonus_points': { en: 'Bonus Points', ru: 'Бонусные баллы', cz: 'Bonusové body' },
  'loyalty.discount_percent': { en: 'Discount %', ru: 'Скидка %', cz: 'Sleva %' },
  'loyalty.start_date': { en: 'Start Date', ru: 'Дата начала', cz: 'Datum začátku' },
  'loyalty.end_date': { en: 'End Date', ru: 'Дата окончания', cz: 'Datum konce' },
  'loyalty.min_amount': { en: 'Minimum Amount', ru: 'Минимальная сумма', cz: 'Minimální částka' },
  'loyalty.for_all_clients': { en: 'For All Clients', ru: 'Для всех клиентов', cz: 'Pro všechny klienty' },
  'loyalty.for_specific_client': { en: 'For Specific Client', ru: 'Для конкретного клиента', cz: 'Pro konkrétního klienta' },
  'loyalty.client_balance': { en: 'Client Balance', ru: 'Баланс клиента', cz: 'Zůstatek klienta' },
  'loyalty.points': { en: 'Points', ru: 'Баллы', cz: 'Body' },
  'loyalty.cashback': { en: 'Cashback', ru: 'Кэшбэк', cz: 'Cashback' },
  'loyalty.current_level': { en: 'Current Level', ru: 'Текущий уровень', cz: 'Aktuální úroveň' },
  'loyalty.transaction_history': { en: 'Transaction History', ru: 'История транзакций', cz: 'Historie transakcí' },
  'loyalty.transaction_type': { en: 'Type', ru: 'Тип', cz: 'Typ' },
  'loyalty.transaction_earned': { en: 'Earned', ru: 'Начислено', cz: 'Získáno' },
  'loyalty.transaction_spent': { en: 'Spent', ru: 'Потрачено', cz: 'Utráceno' },
  'loyalty.transaction_birthday': { en: 'Birthday Bonus', ru: 'Бонус ко дню рождения', cz: 'Narozeninový bonus' },
  'loyalty.transaction_level_up': { en: 'Level Up', ru: 'Повышение уровня', cz: 'Povýšení úrovně' },
  'loyalty.use_points': { en: 'Use Points', ru: 'Использовать баллы', cz: 'Použít body' },
  'loyalty.points_to_use': { en: 'Points to Use', ru: 'Баллов к использованию', cz: 'Body k použití' },
  'loyalty.cashback_to_use': { en: 'Cashback to Use', ru: 'Кэшбэк к использованию', cz: 'Cashback k použití' },
  'loyalty.discount_amount': { en: 'Discount Amount', ru: 'Сумма скидки', cz: 'Výše slevy' },
  'loyalty.no_program': { en: 'No loyalty program created', ru: 'Программа лояльности не создана', cz: 'Věrnostní program není vytvořen' },
  'loyalty.program_not_active': { en: 'Program is not active', ru: 'Программа не активна', cz: 'Program není aktivní' },
  'loyalty.activate_program': { en: 'Activate Program', ru: 'Активировать программу', cz: 'Aktivovat program' },
  'loyalty.deactivate_program': { en: 'Deactivate Program', ru: 'Деактивировать программу', cz: 'Deaktivovat program' },
  'loyalty.no_levels': { en: 'No levels created', ru: 'Уровни не созданы', cz: 'Úrovně nejsou vytvořeny' },
  'loyalty.no_promotions': { en: 'No promotions', ru: 'Акций нет', cz: 'Žádné akce' },
  'loyalty.no_transactions': { en: 'No transactions', ru: 'Транзакций нет', cz: 'Žádné transakce' },
  'loyalty.service_ids': { en: 'Service IDs (comma-separated)', ru: 'ID услуг (через запятую)', cz: 'ID služeb (oddělené čárkou)' },
  'loyalty.service_ids_placeholder': { en: 'e.g., 1, 2, 3 (leave empty for all services)', ru: 'например, 1, 2, 3 (оставьте пустым для всех услуг)', cz: 'např. 1, 2, 3 (ponechte prázdné pro všechny služby)' },
  
  // Common
  'common.currency': { en: 'CZK', ru: 'CZK', cz: 'CZK' },
  'common.close': { en: 'Close', ru: 'Закрыть', cz: 'Zavřít' },
  'common.days': { en: 'days', ru: 'дней', cz: 'dny' },
  'common.actions': { en: 'Actions', ru: 'Действия', cz: 'Akce' },
}

export default translations

