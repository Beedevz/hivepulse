import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../../../shared/ThemeProvider'
import { LeftPanel } from '../LeftPanel'

vi.mock('react-router-dom', async (orig) => {
  const actual = await orig<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => vi.fn() }
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        {children}
      </QueryClientProvider>
    </MemoryRouter>
  </ThemeProvider>
)

describe('LeftPanel', () => {
  it('renders monitor list from API', async () => {
    render(<LeftPanel selectedMonitorId={null} onAddClick={vi.fn()} />, { wrapper })
    await waitFor(() => expect(screen.getByText('Test API')).toBeInTheDocument())
  })

  it('renders MONITORS header label', () => {
    render(<LeftPanel selectedMonitorId={null} onAddClick={vi.fn()} />, { wrapper })
    expect(screen.getByText('Monitors')).toBeInTheDocument()
  })

  it('calls onAddClick when + Add button clicked', () => {
    const onAdd = vi.fn()
    render(<LeftPanel selectedMonitorId={null} onAddClick={onAdd} />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: /\+ add/i }))
    expect(onAdd).toHaveBeenCalled()
  })
})
