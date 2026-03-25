import { useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import { usePublicStatusPage } from '../../application/useStatusPages'
import { UptimeBar } from '../components/UptimeBar'
import type { PublicMonitorRow, PublicIncident, DailyBucket } from '../../domain/statusPage'
import type { BlockStatus } from '../components/UptimeBar'

function toBlocks(buckets: DailyBucket[]): BlockStatus[] {
  return buckets.map((b) =>
    b.uptime_pct >= 0.99 ? 'up' : b.uptime_pct === 0 ? 'down' : 'unknown',
  )
}

const overallLabel: Record<string, string> = {
  operational: 'All Systems Operational',
  degraded: 'Partial Degradation',
  outage: 'Major Outage',
}

const overallColor: Record<string, string> = {
  operational: 'success',
  degraded: 'warning',
  outage: 'error',
}

function MonitorStatusRow({ monitor }: Readonly<{ monitor: PublicMonitorRow }>) {
  const statusColor =
    monitor.last_status === 'up' ? '#4ADE80' : monitor.last_status === 'down' ? '#F87171' : '#94A3B8'
  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: statusColor }} />
          <Typography fontSize="0.9375rem" fontWeight={600}>{monitor.name}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography fontSize="0.8125rem" color="text.secondary">
            {(monitor.uptime_24h * 100).toFixed(2)}%
          </Typography>
          <Chip
            label={monitor.last_status === 'up' ? 'Operational' : monitor.last_status === 'down' ? 'Outage' : 'Unknown'}
            color={monitor.last_status === 'up' ? 'success' : monitor.last_status === 'down' ? 'error' : 'default'}
            size="small"
          />
        </Box>
      </Box>
      <UptimeBar blocks={toBlocks(monitor.daily_buckets)} />
    </Box>
  )
}

function IncidentRow({ incident }: Readonly<{ incident: PublicIncident }>) {
  const date = new Date(incident.started_at).toLocaleDateString()
  const durationMin = Math.round(incident.duration_s / 60)
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
      <Chip label="resolved" color="success" size="small" variant="outlined" />
      <Typography fontSize="0.875rem" color="text.secondary">
        {incident.monitor_name} — {durationMin}m · {date}
      </Typography>
    </Box>
  )
}

export function PublicStatusPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isPending, isError } = usePublicStatusPage(slug ?? '')

  if (isPending) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
        <CircularProgress role="progressbar" />
      </Box>
    )
  }

  if (isError || !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
        <Typography color="text.secondary">Status page not found.</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ bgcolor: `${data.accent_color}18`, borderBottom: '1px solid', borderColor: 'divider', py: 4 }}>
        <Box sx={{ maxWidth: 760, mx: 'auto', px: 3 }}>
          {data.logo_url && (
            <Box component="img" src={data.logo_url} alt="logo" sx={{ height: 40, mb: 2 }} />
          )}
          <Typography variant="h5" fontWeight={700} fontFamily="'Bricolage Grotesque', sans-serif">
            {data.title}
          </Typography>
          {data.description && (
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>{data.description}</Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ maxWidth: 760, mx: 'auto', px: 3, py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Chip
            label={overallLabel[data.overall_status] ?? data.overall_status}
            color={overallColor[data.overall_status] as 'success' | 'warning' | 'error'}
            sx={{ fontSize: '0.9375rem', fontWeight: 600, px: 1.5, py: 2.5 }}
          />
        </Box>

        {data.active_incidents.length > 0 && (
          <Box sx={{ bgcolor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 1.5, p: 2, mb: 3 }}>
            <Typography fontWeight={700} color="error.main" sx={{ mb: 0.5 }}>
              Active Incident
            </Typography>
            {data.active_incidents.map((inc) => (
              <Typography key={inc.id} fontSize="0.875rem" color="text.secondary">
                {inc.monitor_name} — {inc.error_msg}
              </Typography>
            ))}
          </Box>
        )}

        <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1.5, px: 3, mb: 3 }}>
          <Typography fontSize="0.6875rem" fontWeight={700} letterSpacing={1} color="text.disabled" sx={{ pt: 2, pb: 1 }}>
            MONITORS
          </Typography>
          {data.monitors.map((m, i) => (
            <Box key={m.id}>
              {i > 0 && <Divider />}
              <MonitorStatusRow monitor={m} />
            </Box>
          ))}
          {data.monitors.length === 0 && (
            <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>No monitors configured.</Typography>
          )}
        </Box>

        {data.recent_incidents.length > 0 && (
          <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1.5, px: 3, mb: 3 }}>
            <Typography fontSize="0.6875rem" fontWeight={700} letterSpacing={1} color="text.disabled" sx={{ pt: 2, pb: 1 }}>
              RECENT INCIDENTS
            </Typography>
            {data.recent_incidents.map((inc, i) => (
              <Box key={inc.id}>
                {i > 0 && <Divider />}
                <IncidentRow incident={inc} />
              </Box>
            ))}
          </Box>
        )}

        <Typography fontSize="0.75rem" color="text.disabled" textAlign="center" sx={{ mt: 4 }}>
          Powered by HivePulse
        </Typography>
      </Box>
    </Box>
  )
}
