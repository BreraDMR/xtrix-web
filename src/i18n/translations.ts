export type Locale = 'en' | 'ru' | 'cz'

export const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    clients: 'Clients',
    visits: 'Visits',
    calendar: 'Calendar',
    services: 'Services',
    logout: 'Logout',
    
    // Auth
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    phone: 'Phone',
    fullName: 'Full Name',
    forgotPassword: 'Forgot password?',
    resetPassword: 'Reset Password',
    resetCode: 'Reset Code',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    sendCode: 'Send Code',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    add: 'Add',
    create: 'Create',
    update: 'Update',
    search: 'Search',
    filter: 'Filter',
    close: 'Close',
    loading: 'Loading...',
    noData: 'No data available',
    
    // Clients
    addClient: 'Add Client',
    editClient: 'Edit Client',
    clientName: 'Client Name',
    clientPhone: 'Client Phone',
    clientEmail: 'Client Email',
    clientDetails: 'Client Details',
    
    // Services
    addService: 'Add Service',
    editService: 'Edit Service',
    serviceName: 'Service Name',
    servicePrice: 'Price',
    serviceDuration: 'Duration (minutes)',
    serviceDescription: 'Description',
    
    // Visits
    addVisit: 'Add Visit',
    editVisit: 'Edit Visit',
    visitClient: 'Client',
    visitService: 'Service',
    visitDate: 'Date',
    visitStartTime: 'Start Time',
    visitEndTime: 'End Time',
    visitPrice: 'Price',
    visitNotes: 'Notes',
    visitsFor: 'Visits for',
    
    // Calendar
    selectDate: 'Select a date',
    noVisits: 'No visits scheduled',
    
    // Messages
    saveSuccess: 'Saved successfully',
    deleteSuccess: 'Deleted successfully',
    errorOccurred: 'An error occurred',
    requiredField: 'This field is required',
    
    // Password requirements
    passwordRequirements: 'Password must be at least 8 characters long, contain uppercase and lowercase letters, numbers, and special characters',
  },
  ru: {
    // Navigation
    dashboard: 'Панель управления',
    clients: 'Клиенты',
    visits: 'Визиты',
    calendar: 'Календарь',
    services: 'Услуги',
    logout: 'Выйти',
    
    // Auth
    login: 'Вход',
    register: 'Регистрация',
    email: 'Электронная почта',
    password: 'Пароль',
    phone: 'Телефон',
    fullName: 'Полное имя',
    forgotPassword: 'Забыли пароль?',
    resetPassword: 'Сброс пароля',
    resetCode: 'Код сброса',
    newPassword: 'Новый пароль',
    confirmPassword: 'Подтвердите пароль',
    sendCode: 'Отправить код',
    
    // Common
    save: 'Сохранить',
    cancel: 'Отмена',
    edit: 'Редактировать',
    delete: 'Удалить',
    add: 'Добавить',
    create: 'Создать',
    update: 'Обновить',
    search: 'Поиск',
    filter: 'Фильтр',
    close: 'Закрыть',
    loading: 'Загрузка...',
    noData: 'Нет данных',
    
    // Clients
    addClient: 'Добавить клиента',
    editClient: 'Редактировать клиента',
    clientName: 'Имя клиента',
    clientPhone: 'Телефон клиента',
    clientEmail: 'Email клиента',
    clientDetails: 'Детали клиента',
    
    // Services
    addService: 'Добавить услугу',
    editService: 'Редактировать услугу',
    serviceName: 'Название услуги',
    servicePrice: 'Цена',
    serviceDuration: 'Длительность (минуты)',
    serviceDescription: 'Описание',
    
    // Visits
    addVisit: 'Добавить визит',
    editVisit: 'Редактировать визит',
    visitClient: 'Клиент',
    visitService: 'Услуга',
    visitDate: 'Дата',
    visitStartTime: 'Время начала',
    visitEndTime: 'Время окончания',
    visitPrice: 'Цена',
    visitNotes: 'Заметки',
    visitsFor: 'Визиты на',
    
    // Calendar
    selectDate: 'Выберите дату',
    noVisits: 'Нет запланированных визитов',
    
    // Messages
    saveSuccess: 'Успешно сохранено',
    deleteSuccess: 'Успешно удалено',
    errorOccurred: 'Произошла ошибка',
    requiredField: 'Это поле обязательно',
    
    // Password requirements
    passwordRequirements: 'Пароль должен быть не менее 8 символов, содержать заглавные и строчные буквы, цифры и специальные символы',
  },
  cz: {
    // Navigation
    dashboard: 'Nástěnka',
    clients: 'Klienti',
    visits: 'Návštěvy',
    calendar: 'Kalendář',
    services: 'Služby',
    logout: 'Odhlásit se',
    
    // Auth
    login: 'Přihlásit se',
    register: 'Registrovat se',
    email: 'Email',
    password: 'Heslo',
    phone: 'Telefon',
    fullName: 'Celé jméno',
    forgotPassword: 'Zapomenuté heslo?',
    resetPassword: 'Resetovat heslo',
    resetCode: 'Kód pro reset',
    newPassword: 'Nové heslo',
    confirmPassword: 'Potvrďte heslo',
    sendCode: 'Odeslat kód',
    
    // Common
    save: 'Uložit',
    cancel: 'Zrušit',
    edit: 'Upravit',
    delete: 'Smazat',
    add: 'Přidat',
    create: 'Vytvořit',
    update: 'Aktualizovat',
    search: 'Hledat',
    filter: 'Filtr',
    close: 'Zavřít',
    loading: 'Načítání...',
    noData: 'Žádná data',
    
    // Clients
    addClient: 'Přidat klienta',
    editClient: 'Upravit klienta',
    clientName: 'Jméno klienta',
    clientPhone: 'Telefon klienta',
    clientEmail: 'Email klienta',
    clientDetails: 'Detaily klienta',
    
    // Services
    addService: 'Přidat službu',
    editService: 'Upravit službu',
    serviceName: 'Název služby',
    servicePrice: 'Cena',
    serviceDuration: 'Délka (minuty)',
    serviceDescription: 'Popis',
    
    // Visits
    addVisit: 'Přidat návštěvu',
    editVisit: 'Upravit návštěvu',
    visitClient: 'Klient',
    visitService: 'Služba',
    visitDate: 'Datum',
    visitStartTime: 'Čas začátku',
    visitEndTime: 'Čas konce',
    visitPrice: 'Cena',
    visitNotes: 'Poznámky',
    visitsFor: 'Návštěvy na',
    
    // Calendar
    selectDate: 'Vyberte datum',
    noVisits: 'Žádné naplánované návštěvy',
    
    // Messages
    saveSuccess: 'Úspěšně uloženo',
    deleteSuccess: 'Úspěšně smazáno',
    errorOccurred: 'Došlo k chybě',
    requiredField: 'Toto pole je povinné',
    
    // Password requirements
    passwordRequirements: 'Heslo musí mít alespoň 8 znaků, obsahovat velká a malá písmena, číslice a speciální znaky',
  },
} as const

export function t(key: keyof typeof translations.en, locale: Locale): string {
  return translations[locale][key] || translations.en[key] || key
}

