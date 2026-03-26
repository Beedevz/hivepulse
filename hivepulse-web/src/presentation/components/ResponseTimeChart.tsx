import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { StatsBucket, StatsRange } from '../../domain/stats'

interface Props {
  buckets: StatsBucket[]
  range: '24h' | '7d'
}

function formatTime(iso: string, range: StatsRange): string {
  const d = new Date(iso)
  if (range === '24h') {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
}

export function ResponseTimeChart({ buckets, range }: Readonly<Props>) {
  const theme = useTheme()
  if (!buckets || buckets.length === 0) {
    return <Typography>No data</Typography>
  }

  const data = buckets.map((b) => ({
    time: formatTime(b.time, range),
    avg_ping_ms: b.avg_ping_ms,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis dataKey="time" tick={{ fontSize: 11 }} />
        <YAxis unit=" ms" tick={{ fontSize: 11 }} width={52} />
        <Tooltip
          contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 6, fontSize: 12 }}
          labelStyle={{ color: theme.palette.text.secondary }}
          itemStyle={{ color: theme.palette.text.primary }}
        />
        <Line type="monotone" dataKey="avg_ping_ms" stroke="#F5A623" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
