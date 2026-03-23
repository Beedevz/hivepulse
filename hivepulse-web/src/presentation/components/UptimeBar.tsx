type BlockStatus = 'up' | 'down' | 'slow' | 'unknown'

const colorMap: Record<BlockStatus, string> = {
  up:      'bg-green-500',
  down:    'bg-red-500',
  slow:    'bg-yellow-400',
  unknown: 'bg-gray-300 dark:bg-gray-600',
}

interface UptimeBarProps {
  blocks: BlockStatus[]
}

export function UptimeBar({ blocks }: UptimeBarProps) {
  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: 'repeat(48, 1fr)', gap: '1px' }}
      className="h-6 w-full rounded overflow-hidden"
    >
      {blocks.map((status, i) => (
        <div key={i} className={`${colorMap[status]} h-full`} title={status} />
      ))}
    </div>
  )
}
