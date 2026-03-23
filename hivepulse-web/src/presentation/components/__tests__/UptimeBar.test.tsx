import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { UptimeBar } from '../UptimeBar'

type BlockStatus = 'up' | 'down' | 'slow' | 'unknown'

describe('UptimeBar', () => {
  it('renders exactly 48 blocks', () => {
    const blocks = Array(48).fill('unknown') as BlockStatus[]
    const { container } = render(<UptimeBar blocks={blocks} />)
    const grid = container.firstChild as HTMLElement
    expect(grid.children).toHaveLength(48)
  })

  it('applies green class for up blocks', () => {
    const blocks = Array(48).fill('up') as BlockStatus[]
    const { container } = render(<UptimeBar blocks={blocks} />)
    const firstBlock = container.firstChild!.firstChild as HTMLElement
    expect(firstBlock.className).toContain('bg-green')
  })

  it('applies red class for down blocks', () => {
    const blocks: BlockStatus[] = ['down', ...Array(47).fill('unknown') as BlockStatus[]]
    const { container } = render(<UptimeBar blocks={blocks} />)
    const firstBlock = container.firstChild!.firstChild as HTMLElement
    expect(firstBlock.className).toContain('bg-red')
  })
})
