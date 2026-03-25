import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SendIcon from '@mui/icons-material/Send'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import { useTestChannel } from '../../application/useNotifications'
import type { NotificationChannel } from '../../domain/notification'

interface Props {
  channel: NotificationChannel
  onEdit: (ch: NotificationChannel) => void
  onDelete: (id: string) => void
}

function TestIcon({ isPending, result }: Readonly<{ isPending: boolean; result: 'success' | 'error' | null }>) {
  if (isPending) return <CircularProgress size={16} />
  if (result === 'success') return <CheckCircleIcon fontSize="small" />
  if (result === 'error') return <ErrorIcon fontSize="small" />
  return <SendIcon fontSize="small" />
}

export function ChannelCard({ channel, onEdit, onDelete }: Readonly<Props>) {
  const testMutation = useTestChannel()
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  const handleTest = async () => {
    setTestResult(null)
    try {
      await testMutation.mutateAsync(channel.id)
      setTestResult('success')
      setTimeout(() => setTestResult(null), 3000)
    } catch {
      setTestResult('error')
      setTimeout(() => setTestResult(null), 3000)
    }
  }

  let testColor: 'success' | 'error' | 'default' = 'default'
  if (testResult === 'success') testColor = 'success'
  if (testResult === 'error') testColor = 'error'

  return (
    <Box
      sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 2, py: 1.5, border: '1px solid', borderColor: 'divider',
        borderRadius: 2, bgcolor: 'background.paper', mb: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography fontWeight={600} fontSize="0.9375rem">{channel.name}</Typography>
            <Chip label={channel.type} size="small" sx={{ fontSize: '0.6875rem', height: 20 }} />
            {channel.is_global && (
              <Chip label="Global" size="small" color="primary" sx={{ fontSize: '0.6875rem', height: 20 }} />
            )}
          </Box>
          {channel.remind_interval_min > 0 && (
            <Typography fontSize="0.75rem" color="text.secondary">
              Repeat every {channel.remind_interval_min}min
            </Typography>
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title="Send test notification">
          <span>
            <IconButton
              size="small"
              aria-label="test"
              onClick={handleTest}
              disabled={testMutation.isPending}
              color={testColor}
            >
              <TestIcon isPending={testMutation.isPending} result={testResult} />
            </IconButton>
          </span>
        </Tooltip>
        <IconButton size="small" aria-label="edit" onClick={() => onEdit(channel)}>
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" aria-label="delete" onClick={() => onDelete(channel.id)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  )
}
