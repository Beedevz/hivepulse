import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import type { NotificationChannel } from '../../domain/notification'

interface Props {
  channel: NotificationChannel
  onEdit: (ch: NotificationChannel) => void
  onDelete: (id: string) => void
}

export function ChannelCard({ channel, onEdit, onDelete }: Readonly<Props>) {
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
      <Box>
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
