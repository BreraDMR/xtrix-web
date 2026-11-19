import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'

import QuestionnaireAnswers from '../components/clients/QuestionnaireAnswers'
import api from '../api/client'
import { renderWithProviders, resetStores } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

// FORM-12 review: the staff side had no way to hand a guest the questionnaire link,
// it only existed as an API call. Unanswered visits now offer one.

function httpError(status: number) {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, {}, {
    status, statusText: '', headers: {}, config, data: {},
  })
}

const TEMPLATE = {
  id: 1, name: 'Intake', description: null, fields: [], service_id: 5, published_version: 2,
  updated_at: '2030-01-01T10:00:00Z',
}

// answers: 404 = the guest has not answered yet; templates: what the owner has bound
function mockGets(templates: unknown) {
  vi.mocked(api.get).mockImplementation(async (url: string) => {
    if (url === '/businesses/me/questionnaires/') {
      if (templates instanceof Error) throw templates
      return { data: templates }
    }
    throw httpError(404)
  })
}

beforeEach(() => {
  resetStores()
  mockGets([TEMPLATE])
})

afterEach(() => {
  vi.clearAllMocks()
})

it('creates a one-visit link for an unanswered visit and lets staff copy it', async () => {
  vi.mocked(api.post).mockResolvedValue({
    data: { token: 'tok-123_abc', visit_id: 7, version: 2, expires_at: '2030-01-08T10:00:00Z' },
  })
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  renderWithProviders(<QuestionnaireAnswers visitId={7} serviceId={5} />)

  // nothing is issued until somebody asks for it
  const create = await screen.findByRole('button', { name: 'Create questionnaire link' })
  expect(api.post).not.toHaveBeenCalled()
  await userEvent.click(create)

  expect(api.post).toHaveBeenCalledWith('/visits/7/questionnaire-token')
  const link = await screen.findByRole('textbox', { name: 'Questionnaire link' })
  expect(link).toHaveValue(`${window.location.origin}/questionnaire#token=tok-123_abc`)
  expect(link).toHaveAttribute('readonly')
  expect(screen.getByText(/Version 2/)).toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: 'Copy link' }))
  expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/questionnaire#token=tok-123_abc`)
  expect(await screen.findByText('Link copied')).toBeInTheDocument()
})

it('stays out of the way when the owner bound no questionnaire to the service', async () => {
  mockGets([{ ...TEMPLATE, service_id: 99 }, { ...TEMPLATE, id: 2, service_id: 5, published_version: null }])
  renderWithProviders(<QuestionnaireAnswers visitId={8} serviceId={5} />)
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/businesses/me/questionnaires/'))
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/visits/8/questionnaire'))
  expect(screen.queryByRole('button', { name: 'Create questionnaire link' })).not.toBeInTheDocument()
  expect(screen.queryByText('Questionnaire')).not.toBeInTheDocument()
})

it('lets staff ask and explains when the service has no published questionnaire', async () => {
  mockGets(httpError(403))
  vi.mocked(api.post).mockRejectedValue(httpError(404))
  renderWithProviders(<QuestionnaireAnswers visitId={8} serviceId={5} />)
  await userEvent.click(await screen.findByRole('button', { name: 'Create questionnaire link' }))
  expect(await screen.findByText('This service has no published questionnaire yet.')).toBeInTheDocument()
  expect(screen.queryByRole('textbox', { name: 'Questionnaire link' })).not.toBeInTheDocument()
})

it('does not offer a link when the answers are already there', async () => {
  vi.mocked(api.get).mockImplementation(async (url: string) => (url.startsWith('/visits/') ? {
    data: {
      version: 1, name: 'Intake', description: null, submitted_at: '2030-01-01T10:00:00Z',
      fields: [{ key: 'hair', label: 'Hair', type: 'text', required: true, max_length: 10 }],
      answers: { hair: 'short' },
    },
  } : { data: [TEMPLATE] }))
  renderWithProviders(<QuestionnaireAnswers visitId={9} serviceId={5} />)
  expect(await screen.findByText('short')).toBeInTheDocument()
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Create questionnaire link' })).not.toBeInTheDocument())
})
