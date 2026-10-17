import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import BusinessForm from '../components/BusinessForm'
import ClientForm from '../components/ClientForm'
import ServiceForm from '../components/ServiceForm'
import EmployeeForm from '../components/EmployeeForm'
import Register from '../pages/Register'
import SalaryPaymentModal from '../components/SalaryPaymentModal'
import SalaryAdjustmentModal from '../components/SalaryAdjustmentModal'
import api from '../api/client'
import { useLocaleStore } from '../store/localeStore'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))
const noop = () => {}
const locales = [
  { locale: 'en', business: 'Business Name', client: 'Full Name', service: 'Service Name', contact: 'At least one of Email or Phone is required', password: 'Generated Password:', copy: 'Copy', payment: 'Record Payment', adjustment: 'Add Adjustment', required: 'Full Name is required' },
  { locale: 'ru', business: 'Название бизнеса', client: 'Полное имя', service: 'Название услуги', contact: 'Укажите email или телефон — достаточно одного из двух', password: 'Сгенерированный пароль:', copy: 'Копировать', payment: 'Зарегистрировать выплату', adjustment: 'Добавить начисление/удержание', required: 'Укажите полное имя' },
  { locale: 'cz', business: 'Název podniku', client: 'Jméno a příjmení', service: 'Název služby', contact: 'Zadejte e-mail nebo telefon — stačí jeden z údajů', password: 'Vygenerované heslo:', copy: 'Kopírovat', payment: 'Zaznamenat platbu', adjustment: 'Přidat příplatek / srážku', required: 'Zadejte jméno a příjmení' },
] as const

beforeEach(() => {
  vi.clearAllMocks()
  resetStores()
  signIn({ id: 2, role: 'business_owner', business_id: 1 })
  vi.mocked(api.get).mockImplementation(routes({ '/employees/': [], '/users/': [], '/specialist-profiles/types': { categories: {} }, '/businesses/me': { currency: 'EUR' } }) as any)
})

for (const copy of locales) {
  describe(`translated forms in ${copy.locale}`, () => {
    beforeEach(() => useLocaleStore.setState({ locale: copy.locale }))
    it('translates business fields', () => {
      renderWithProviders(<BusinessForm onSuccess={noop} onCancel={noop} />)
      expect(screen.getByText(`${copy.business} *`)).toBeInTheDocument()
    })
    it('translates client fields and validation', () => {
      const { container } = renderWithProviders(<ClientForm onSuccess={noop} onCancel={noop} />)
      expect(screen.getByLabelText(new RegExp(copy.client))).toBeInTheDocument()
      fireEvent.submit(container.querySelector('form')!)
      expect(screen.getByText(copy.required)).toBeInTheDocument()
      expect(api.post).not.toHaveBeenCalled()
    })
    it('translates service fields', async () => {
      renderWithProviders(<ServiceForm onSuccess={noop} onCancel={noop} />)
      expect(screen.getByText(`${copy.service} *`)).toBeInTheDocument()
      await screen.findByRole('combobox')
    })
    it('translates the employee password screen', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { generated_password: 'Generated!42' } })
      const { container } = renderWithProviders(<EmployeeForm onSuccess={noop} onCancel={noop} />)
      fireEvent.change(container.querySelector('#employee_full_name')!, { target: { value: 'Jana' } })
      fireEvent.change(container.querySelector('#employee_email')!, { target: { value: 'jana@example.com' } })
      fireEvent.submit(container.querySelector('form')!)
      expect(await screen.findByText(copy.password)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: copy.copy })).toBeInTheDocument()
    })
    it('explains the alternative registration contacts without marking both required', () => {
      resetStores()
      useLocaleStore.setState({ locale: copy.locale })
      const { container } = renderWithProviders(<Register />)
      expect(screen.getByText(copy.contact)).toBeInTheDocument()
      for (const id of ['email', 'phone']) {
        expect(container.querySelector(`label[for="${id}"]`)).not.toHaveTextContent('*')
        expect(container.querySelector(`#${id}`)).not.toBeRequired()
      }
    })
    it('translates salary payment labels', () => {
      renderWithProviders(<SalaryPaymentModal isOpen onClose={noop} employeeId={1} salaryId={1} remainingAmount={100} />)
      expect(screen.getByRole('heading', { name: copy.payment })).toBeInTheDocument()
    })
    it('translates salary adjustment labels', () => {
      renderWithProviders(<SalaryAdjustmentModal isOpen onClose={noop} employeeId={1} salaryId={1} />)
      expect(screen.getByRole('heading', { name: copy.adjustment })).toBeInTheDocument()
    })
  })
}

// UI copy is easy to miss in a conditional branch; inspect every requested screen.
const screenSources = import.meta.glob([
  '../components/{BusinessForm,ClientForm,ServiceForm,EmployeeForm,ImportClientsModal,SalaryPaymentModal,SalaryAdjustmentModal,VisitForm,TablePagination}.tsx',
  '../pages/{Business,EmployeeSalary,MySalary,Dashboard,Register,Inventory}.tsx',
], { query: '?raw', import: 'default', eager: true }) as Record<string, string>

it('keeps screen copy in the translation dictionary', async () => {
  const ts = await import('typescript')
  const translations = (await import('../i18n/translations')).default
  const untranslated: string[] = []
  const allowed = new Set(['Xtrix', 'PDF', 'Excel', 'EUR (€)', 'USD ($)', 'CZK (Kč)', 'RUB (₽)', 'UAH (₴)'])
  for (const [path, source] of Object.entries(screenSources)) {
    const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const walk = (node: import('typescript').Node) => {
      if (ts.isJsxText(node)) {
        const value = node.text.trim()
        if (/\p{L}/u.test(value) && !allowed.has(value)) untranslated.push(`${path}: ${value}`)
      }
      if (ts.isCallExpression(node) && node.expression.getText(file) === 't' && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
        const key = node.arguments[0].text
        const entry = translations[key as keyof typeof translations]
        for (const locale of ['en', 'ru', 'cz'] as const) {
          if (!entry?.[locale]) untranslated.push(`${path}: missing ${key}/${locale}`)
        }
      }
      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.BarBarToken && ts.isCallExpression(node.left) && node.left.expression.getText(file) === 't') {
        untranslated.push(`${path}: ineffective translation fallback`)
      }
      ts.forEachChild(node, walk)
    }
    walk(file)
  }
  expect(Object.keys(screenSources)).toHaveLength(15)
  expect(untranslated).toEqual([])
})
