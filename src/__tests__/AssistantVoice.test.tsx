import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AssistantLauncher from '../components/assistant/AssistantLauncher'
import api from '../api/client'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

const status = (over: Record<string, unknown> = {}) => ({
  enabled: true, voice_enabled: true, assistant: { name: 'Sasha', gender: 'female', is_default: true },
  limit: 100, used: 0, resets_at: '2026-11-01T00:00:00Z', ...over,
})

// --- a pretend microphone ----------------------------------------------------

const track = { stop: vi.fn() }
const stream = { getTracks: () => [track] }
let supported: (type: string) => boolean = (type) => type.startsWith('audio/webm')
let recorders: FakeRecorder[] = []

class FakeRecorder {
  static isTypeSupported = (type: string) => supported(type)
  state: 'inactive' | 'recording' = 'inactive'
  mimeType: string
  ondataavailable: ((event: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor(public stream: unknown, options?: { mimeType?: string }) {
    this.mimeType = options?.mimeType ?? ''
    recorders.push(this)
  }
  start() {
    this.state = 'recording'
  }
  stop() {
    if (this.state === 'inactive') return
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob(['fake audio'], { type: this.mimeType }) })
    this.onstop?.()
  }
}

const getUserMedia = vi.fn()

function installMicrophone() {
  Object.defineProperty(window, 'MediaRecorder', { value: FakeRecorder, configurable: true, writable: true })
  Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true })
}

function removeMicrophone() {
  Object.defineProperty(window, 'MediaRecorder', { value: undefined, configurable: true, writable: true })
}

// -----------------------------------------------------------------------------

const input = () => screen.findByRole('textbox', { name: 'Type a request…' })
const mic = () => screen.findByRole('button', { name: 'Dictate' })

async function openPanel() {
  await userEvent.click(screen.getByRole('button', { name: /open the assistant/i }))
  return screen.findByRole('dialog')
}

function lastUpload() {
  const call = vi.mocked(api.post).mock.calls.find(([url]) => url === '/assistant/transcribe')
  if (!call) throw new Error('nothing was uploaded')
  return { form: call[1] as FormData, config: call[2] as { headers?: Record<string, string> } }
}

describe('voice input', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 5, role: 'business_owner', business_id: 1 })
    vi.mocked(api.get).mockImplementation(routes({ '/assistant/status': status(), '/businesses/me': null }))
    vi.mocked(api.post).mockResolvedValue({ data: { text: 'Book Clara tomorrow at ten' } })
    supported = (type) => type.startsWith('audio/webm')
    recorders = []
    getUserMedia.mockResolvedValue(stream)
    installMicrophone()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("has no microphone when the server can't transcribe", async () => {
    vi.mocked(api.get).mockImplementation(routes({ '/assistant/status': status({ voice_enabled: false }), '/businesses/me': null }))
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await input()
    expect(screen.queryByRole('button', { name: 'Dictate' })).not.toBeInTheDocument()
  })

  it('records, uploads on stop and puts the text into the input without sending it', async () => {
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await userEvent.click(await mic())
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true })
    expect(await screen.findByRole('timer')).toHaveTextContent('Recording 0:00 / 1:00')
    expect(recorders[0].mimeType).toBe('audio/webm;codecs=opus')
    expect(screen.getByRole('button', { name: /^send$/i })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Stop and transcribe' }))
    expect(await input()).toHaveValue('Book Clara tomorrow at ten')
    const { form, config } = lastUpload()
    const file = form.get('file') as File
    expect(file).toBeInstanceOf(Blob)
    expect(file.type).toBe('audio/webm;codecs=opus')
    expect(file.size).toBeGreaterThan(0)
    expect(config.headers?.['Content-Type']).toBe('multipart/form-data')
    expect(track.stop).toHaveBeenCalled()
    expect(api.post).toHaveBeenCalledTimes(1)
    expect(api.post).not.toHaveBeenCalledWith('/assistant/plan', expect.anything())
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Type a request…' })).toHaveFocus())
  })

  it('adds the heard text after what was already typed', async () => {
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await userEvent.type(await input(), 'Please')
    await userEvent.click(await mic())
    await userEvent.click(await screen.findByRole('button', { name: 'Stop and transcribe' }))
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Type a request…' })).toHaveValue('Please Book Clara tomorrow at ten'))
  })

  it('records mp4 where webm is not there (Safari)', async () => {
    supported = (type) => type === 'audio/mp4'
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await userEvent.click(await mic())
    await userEvent.click(await screen.findByRole('button', { name: 'Stop and transcribe' }))
    await waitFor(() => expect(lastUpload().form.get('file')).toBeTruthy())
    expect(recorders[0].mimeType).toBe('audio/mp4')
    expect((lastUpload().form.get('file') as File).type).toBe('audio/mp4')
  })

  it('stops by itself after 60 seconds and shows the time meanwhile', async () => {
    vi.useFakeTimers()
    renderWithProviders(<AssistantLauncher />)
    fireEvent.click(screen.getByRole('button', { name: /open the assistant/i }))
    await act(async () => { await vi.advanceTimersByTimeAsync(10) })
    fireEvent.click(screen.getByRole('button', { name: 'Dictate' }))
    await act(async () => { await vi.advanceTimersByTimeAsync(10) })
    await act(async () => { await vi.advanceTimersByTimeAsync(5000) })
    expect(screen.getByRole('timer')).toHaveTextContent('Recording 0:05 / 1:00')
    expect(api.post).not.toHaveBeenCalled()
    await act(async () => { await vi.advanceTimersByTimeAsync(55_500) })
    expect(recorders[0].state).toBe('inactive')
    expect(api.post).toHaveBeenCalledWith('/assistant/transcribe', expect.any(FormData), expect.anything())
  })

  it('throws the recording away on Discard', async () => {
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await userEvent.click(await mic())
    await userEvent.click(await screen.findByRole('button', { name: 'Discard the recording' }))
    expect(track.stop).toHaveBeenCalled()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('throws the recording away when the panel is closed', async () => {
    renderWithProviders(<AssistantLauncher />)
    const panel = await openPanel()
    await userEvent.click(await mic())
    await screen.findByRole('timer')
    await userEvent.click(within(panel).getByRole('button', { name: 'Close' }))
    expect(recorders[0].state).toBe('inactive')
    expect(track.stop).toHaveBeenCalled()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('explains a blocked microphone', async () => {
    getUserMedia.mockRejectedValue(new DOMException('denied', 'NotAllowedError'))
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await userEvent.click(await mic())
    expect(await screen.findByRole('alert')).toHaveTextContent('Microphone access is blocked. Allow it in the browser settings and try again.')
    expect(recorders).toHaveLength(0)
  })

  it('says so when the browser has no MediaRecorder', async () => {
    removeMicrophone()
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await userEvent.click(await mic())
    expect(await screen.findByRole('alert')).toHaveTextContent("This browser can't record audio, type the request instead")
    expect(getUserMedia).not.toHaveBeenCalled()
  })

  it('reports other microphone failures', async () => {
    getUserMedia.mockRejectedValue(new DOMException('no device', 'NotFoundError'))
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await userEvent.click(await mic())
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't record audio, try again")
  })

  it('says nothing was heard for an empty transcription', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { text: '  ' } })
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await userEvent.click(await mic())
    await userEvent.click(await screen.findByRole('button', { name: 'Stop and transcribe' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Nothing was heard, try again')
    expect(await input()).toHaveValue('')
  })

  it('translates the audio checks of the API', async () => {
    vi.mocked(api.post).mockRejectedValue(apiError(422, 'Validation failed', {
      validation_errors: [{ field: 'body -> file', message: 'too big', code: 'audio_too_large' }],
    }))
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await userEvent.click(await mic())
    await userEvent.click(await screen.findByRole('button', { name: 'Stop and transcribe' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('The recording is too big, keep it under a minute')
  })

  it('waits out a busy speech service like a busy model', async () => {
    vi.mocked(api.post).mockRejectedValue(apiError(503, 'Busy', { code: 'ai_busy', retry_after: 30 }, { headers: { 'retry-after': '30' } }))
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await userEvent.click(await mic())
    await userEvent.click(await screen.findByRole('button', { name: 'Stop and transcribe' }))
    expect(await screen.findByText(/Sasha is busy right now, try again in (30|29) s/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dictate' })).toBeDisabled()
  })
})
