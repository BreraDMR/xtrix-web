import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import api from '../api/client'
import ImportWizard from '../components/import/ImportWizard'
import { apiError, resetStores, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

const batch = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  status: 'uploaded',
  source_filename: 'clients.csv',
  source_hash: 'a'.repeat(64),
  content_type: 'text/csv',
  headers: ['Name', 'Phone', 'Email', 'Visit date', 'Service', 'Price'],
  column_signature: 'sig',
  mapping: null,
  suggested_mapping: { full_name: 'Name', phone: 'Phone', email: 'Email' },
  mapping_version: 0,
  preview_version: 0,
  duplicate_policy: 'skip',
  row_count: 3,
  valid_count: 0,
  error_count: 0,
  create_count: 0,
  update_count: 0,
  skip_count: 0,
  created_count: 0,
  updated_count: 0,
  skipped_count: 0,
  failed_count: 0,
  last_checkpoint: 0,
  timezone: 'Europe/Prague',
  currency: 'EUR',
  created_at: '2026-10-20T09:00:00Z',
  updated_at: '2026-10-20T09:00:00Z',
  previewed_at: null,
  confirmed_at: null,
  finished_at: null,
  source_expires_at: '2026-10-21T09:00:00Z',
  ...overrides,
})

const row = (overrides: Record<string, unknown> = {}) => ({
  row_number: 2,
  status: 'valid',
  action: 'create',
  error_code: null,
  error_detail: null,
  client_id: null,
  visit_id: null,
  client: { full_name: 'New Client', phone: '+420700111222', email: null },
  visit: null,
  ...overrides,
})

function rowsPage(items: unknown[]) {
  return { items, total: items.length, page: 1, per_page: 50, pages: 1 }
}

function renderAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <ImportWizard />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  resetStores()
  signIn({ id: 7, role: 'business_owner', full_name: 'Olga Owner', business_id: 1 })
})

describe('import wizard', () => {
  it('uploads, maps, previews without writing and confirms exactly once', async () => {
    const user = userEvent.setup()
    const uploaded = batch()
    const mapped = batch({ status: 'mapped', mapping: uploaded.suggested_mapping, mapping_version: 1 })
    const previewed = batch({
      status: 'previewed',
      mapping: uploaded.suggested_mapping,
      mapping_version: 1,
      preview_version: 1,
      valid_count: 2,
      error_count: 1,
      create_count: 1,
      skip_count: 1,
    })
    const summary = {
      already_completed: false,
      batch: batch({
        status: 'completed_with_errors',
        mapping: uploaded.suggested_mapping,
        mapping_version: 1,
        preview_version: 1,
        valid_count: 2,
        error_count: 1,
        created_count: 1,
        skipped_count: 1,
        failed_count: 0,
        last_checkpoint: 4,
        finished_at: '2026-10-20T09:05:00Z',
      }),
    }

    vi.mocked(api.get).mockImplementation(((url: string) => {
      if (url === '/businesses/me/imports') {
        return Promise.resolve({ data: { items: [], total: 0, page: 1, per_page: 10, pages: 1 } })
      }
      if (url === '/businesses/me/imports/1') return Promise.resolve({ data: uploaded })
      if (url === '/businesses/me/imports/1/rows') {
        return Promise.resolve({
          data: rowsPage([
            row(),
            row({ row_number: 3, action: 'skip', client: { full_name: 'Existing Client', phone: null, email: null } }),
            row({ row_number: 4, status: 'error', action: 'create', error_code: 'invalid_phone', client: null }),
          ]),
        })
      }
      return Promise.reject(apiError(404, 'no mock'))
    }) as typeof api.get)

    let resolveConfirm: (value: { data: typeof summary }) => void = () => {}
    const confirmResult = new Promise<{ data: typeof summary }>((resolve) => {
      resolveConfirm = resolve
    })
    let confirmCalls = 0
    vi.mocked(api.post).mockImplementation(((url: string) => {
      if (url === '/businesses/me/imports') return Promise.resolve({ data: uploaded })
      if (url.endsWith('/preview')) return Promise.resolve({ data: previewed })
      if (url.endsWith('/confirm')) {
        confirmCalls += 1
        return confirmResult
      }
      return Promise.reject(apiError(404, 'no mock'))
    }) as typeof api.post)
    vi.mocked(api.put).mockResolvedValue({ data: mapped } as never)

    renderAt('/app/import')
    expect(await screen.findByText('No imports yet.')).toBeInTheDocument()

    const fileInput = screen.getByLabelText('Choose CSV or XLSX')
    await user.upload(
      fileInput,
      new File(['Name,Phone\nA,+420700111222\n'], 'clients.csv', { type: 'text/csv' }),
    )
    await user.click(screen.getByRole('button', { name: 'Upload file' }))

    expect(await screen.findByRole('heading', { name: 'Match the file columns' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('Name')
    expect(screen.getByLabelText('Phone')).toHaveValue('Phone')

    await user.click(screen.getByRole('button', { name: 'Build preview' }))

    expect(await screen.findByRole('heading', { name: 'Check the preview' })).toBeInTheDocument()
    expect(api.put).toHaveBeenCalledWith('/businesses/me/imports/1/mapping', {
      mapping: uploaded.suggested_mapping,
    })
    expect(api.post).toHaveBeenCalledWith('/businesses/me/imports/1/preview', { duplicate_policy: 'skip' })
    expect(screen.getByText('Invalid phone')).toBeInTheDocument()
    expect(screen.getByText(/New Client/)).toBeInTheDocument()
    expect(screen.getAllByText('2').length).toBeGreaterThan(0)

    const confirm = screen.getByRole('button', { name: 'Confirm import' })
    await user.click(confirm)
    await user.click(confirm)
    expect(confirmCalls).toBe(1)
    expect(confirm).toBeDisabled()

    await act(async () => resolveConfirm({ data: summary }))
    expect(await screen.findByRole('heading', { name: 'Import finished' })).toBeInTheDocument()
    expect(
      screen.getByText('Created 1, updated 0, skipped 1, failed 0.'),
    ).toBeInTheDocument()
    expect(screen.getByText(/Some rows could not be imported/)).toBeInTheDocument()
  })

  it('restores an interrupted batch from the URL and continues it', async () => {
    const user = userEvent.setup()
    const interrupted = batch({
      id: 9,
      status: 'importing',
      mapping: { full_name: 'Name' },
      mapping_version: 1,
      preview_version: 1,
      valid_count: 3,
      created_count: 2,
      last_checkpoint: 12,
    })
    const summary = {
      already_completed: false,
      batch: batch({
        id: 9,
        status: 'completed',
        mapping: { full_name: 'Name' },
        mapping_version: 1,
        preview_version: 1,
        valid_count: 3,
        created_count: 3,
        last_checkpoint: 14,
        finished_at: '2026-10-20T10:00:00Z',
      }),
    }
    vi.mocked(api.get).mockResolvedValue({ data: interrupted } as never)
    vi.mocked(api.post).mockResolvedValue({ data: summary } as never)

    renderAt('/app/import?batch=9')

    expect(await screen.findByRole('heading', { name: 'Import paused' })).toBeInTheDocument()
    expect(screen.getByText(/Last saved row: 12/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue import' }))

    expect(await screen.findByRole('heading', { name: 'Import finished' })).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/businesses/me/imports/9/confirm', {
      source_hash: interrupted.source_hash,
      mapping_version: 1,
      preview_version: 1,
      duplicate_policy: 'skip',
    })
    await waitFor(() => expect(screen.getByText('Created 3, updated 0, skipped 0, failed 0.')).toBeInTheDocument())
  })

  it('keeps staff out of the import page', () => {
    signIn({ id: 8, role: 'employee', full_name: 'Eva Employee', employer_id: 1 })
    renderAt('/app/import')
    expect(screen.getByText('You do not have access to imports.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Import clients and visit history' })).not.toBeInTheDocument()
  })
})
