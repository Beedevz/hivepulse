export type ChannelType = 'email' | 'webhook' | 'slack'
export type NotificationEvent = 'down' | 'up' | 'ssl_expiry'

export interface NotificationChannel {
  id: string
  name: string
  type: ChannelType
  config: Record<string, string>
  is_global: boolean
  enabled: boolean
  remind_interval_min: number
  created_at: string
}

export interface NotificationLog {
  id: number
  channel_id: string
  monitor_id: string
  event: NotificationEvent
  status: 'sent' | 'failed'
  error_msg: string
  sent_at: string
}

export interface CreateChannelInput {
  name: string
  type: ChannelType
  config: Record<string, string>
  is_global: boolean
  enabled: boolean
  remind_interval_min: number
}
