import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ConversationList from '../components/assistant/ConversationList'
import type { ConversationOut } from '../api/types'
import { getSavedConversationId, setSavedConversationId } from '../hooks/useConversations'

describe('AssistantConversations', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    localStorage.clear()
  })

  it('persists and restores selected conversation ID across reloads', () => {
    expect(getSavedConversationId(1, 2)).toBeNull()
    setSavedConversationId('conv-123', 1, 2)
    expect(getSavedConversationId(1, 2)).toBe('conv-123')
    // Solo user (businessId is null)
    setSavedConversationId('conv-solo', 1, null)
    expect(getSavedConversationId(1, null)).toBe('conv-solo')
    // Clear on logout
    setSavedConversationId(null, 1, 2)
    expect(getSavedConversationId(1, 2)).toBeNull()
  })

  it('renders list of conversations and triggers selection', async () => {
    const conversations: ConversationOut[] = [
      { id: 'c1', title: 'First Chat', created_at: '2026-10-20T10:00:00Z', updated_at: '2026-10-20T10:00:00Z', archived_at: null },
      { id: 'c2', title: 'Second Chat', created_at: '2026-10-20T11:00:00Z', updated_at: '2026-10-20T11:00:00Z', archived_at: null },
    ]
    const onSelect = vi.fn()
    const onNewChat = vi.fn()
    const onRename = vi.fn().mockResolvedValue({})
    const onArchive = vi.fn().mockResolvedValue({})

    render(
      <ConversationList
        conversations={conversations}
        activeId="c1"
        onSelect={onSelect}
        onNewChat={onNewChat}
        onRename={onRename}
        onArchive={onArchive}
      />
    )

    expect(screen.getByText('First Chat')).toBeInTheDocument()
    expect(screen.getByText('Second Chat')).toBeInTheDocument()

    // Select second chat
    await userEvent.click(screen.getByText('Second Chat'))
    expect(onSelect).toHaveBeenCalledWith('c2')

    // Click new chat
    await userEvent.click(screen.getByRole('button', { name: /New chat|Новый чат/i }))
    expect(onNewChat).toHaveBeenCalled()
  })

  it('handles rename workflow with confirmation and cancel', async () => {
    const conversations: ConversationOut[] = [
      { id: 'c1', title: 'Original Name', created_at: '2026-10-20T10:00:00Z', updated_at: '2026-10-20T10:00:00Z', archived_at: null },
    ]
    const onRename = vi.fn().mockResolvedValue({})

    render(
      <ConversationList
        conversations={conversations}
        activeId="c1"
        onSelect={vi.fn()}
        onNewChat={vi.fn()}
        onRename={onRename}
        onArchive={vi.fn()}
      />
    )

    // Click pencil to edit
    const editBtn = screen.getByLabelText(/Rename|Переименовать/i)
    await userEvent.click(editBtn)

    const input = screen.getByDisplayValue('Original Name')
    await userEvent.clear(input)
    await userEvent.type(input, 'Renamed Chat')

    // Click check to confirm
    const confirmBtn = screen.getByLabelText(/Confirm|Подтвердить/i)
    await userEvent.click(confirmBtn)

    expect(onRename).toHaveBeenCalledWith('c1', 'Renamed Chat')
  })

  it('handles archive workflow with confirmation', async () => {
    const conversations: ConversationOut[] = [
      { id: 'c1', title: 'To Be Archived', created_at: '2026-10-20T10:00:00Z', updated_at: '2026-10-20T10:00:00Z', archived_at: null },
    ]
    const onArchive = vi.fn().mockResolvedValue({})

    render(
      <ConversationList
        conversations={conversations}
        activeId="c1"
        onSelect={vi.fn()}
        onNewChat={vi.fn()}
        onRename={vi.fn()}
        onArchive={onArchive}
      />
    )

    const archiveBtn = screen.getByLabelText(/Archive|Архивировать/i)
    await userEvent.click(archiveBtn)

    // Confirmation prompt appears
    expect(screen.getByText(/Archive this conversation\?|Архивировать этот разговор\?/i)).toBeInTheDocument()

    // Confirm archive
    const confirmBtn = screen.getByRole('button', { name: /Confirm|Подтвердить/i })
    await userEvent.click(confirmBtn)

    expect(onArchive).toHaveBeenCalledWith('c1')
  })
})
