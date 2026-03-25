package domain

import "time"

type ChannelType string

const (
	ChannelEmail   ChannelType = "email"
	ChannelWebhook ChannelType = "webhook"
	ChannelSlack   ChannelType = "slack"
)

type NotificationChannel struct {
	ID                string
	Name              string
	Type              ChannelType
	Config            map[string]string
	IsGlobal          bool
	Enabled           bool
	RemindIntervalMin int
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

type NotificationEvent string

const (
	EventDown      NotificationEvent = "down"
	EventUp        NotificationEvent = "up"
	EventSSLExpiry NotificationEvent = "ssl_expiry"
)

type NotificationLog struct {
	ID        int64
	ChannelID string
	MonitorID string
	Event     NotificationEvent
	Status    string // "sent" | "failed"
	ErrorMsg  string
	SentAt    time.Time
}

// ReminderTarget is a (monitor, channel) pair eligible for re-notification.
type ReminderTarget struct {
	MonitorID string
	ChannelID string
}
