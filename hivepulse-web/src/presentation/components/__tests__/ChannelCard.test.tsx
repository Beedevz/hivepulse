import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChannelCard } from '../ChannelCard'
import type { NotificationChannel } from '../../../domain/notification'

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

const mockChannel: NotificationChannel = {
  id: 'ch-1',
  name: 'Ops Email',
  type: 'email',
  config: { to: 'ops@example.com' },
  is_global: true,
  enabled: true,
  remind_interval_min: 30,
  created_at: '2026-03-25T00:00:00Z',
}

describe('ChannelCard', () => {
  it('renders channel name and type', () => {
    renderWithQuery(<ChannelCard channel={mockChannel} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Ops Email')).toBeInTheDocument()
    expect(screen.getAllByText(/email/i).length).toBeGreaterThan(0)
  })

  it('shows Global badge when is_global is true', () => {
    renderWithQuery(<ChannelCard channel={mockChannel} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText(/global/i)).toBeInTheDocument()
  })

  it('calls onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn()
    renderWithQuery(<ChannelCard channel={mockChannel} onEdit={vi.fn()} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onDelete).toHaveBeenCalledWith('ch-1')
  })
})
