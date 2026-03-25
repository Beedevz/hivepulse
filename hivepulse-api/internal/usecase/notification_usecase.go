package usecase

import (
	"context"
	"log"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
)

type NotificationUsecase struct {
	repo     port.NotificationRepository
	sender   port.NotificationSender
	monitors port.MonitorRepository
}

func NewNotificationUsecase(
	repo port.NotificationRepository,
	sender port.NotificationSender,
	monitors port.MonitorRepository,
) *NotificationUsecase {
	return &NotificationUsecase{repo: repo, sender: sender, monitors: monitors}
}

// Notify is synchronous — the caller (CheckerUsecase) wraps it in `go`.
func (u *NotificationUsecase) Notify(ctx context.Context, monitorID string, event domain.NotificationEvent) {
	channels, err := u.repo.GetChannelsForMonitor(ctx, monitorID)
	if err != nil {
		log.Printf("notification: GetChannelsForMonitor failed for %q: %v", monitorID, err)
		return
	}
	for _, ch := range channels {
		u.notifyChannel(ctx, monitorID, ch.ID, event)
	}
}

func (u *NotificationUsecase) notifyChannel(ctx context.Context, monitorID, channelID string, event domain.NotificationEvent) {
	ch, err := u.repo.GetChannel(ctx, channelID)
	if err != nil {
		log.Printf("notification: GetChannel %s failed: %v", channelID, err)
		return
	}
	monitor, err := u.monitors.FindByID(ctx, monitorID)
	if err != nil {
		log.Printf("notification: FindByID %q failed: %v", monitorID, err)
		return
	}

	var lastErr error
	for attempt := 0; attempt < 3; attempt++ {
		lastErr = u.sender.Send(ctx, ch, event, monitor)
		if lastErr == nil {
			break
		}
		log.Printf("notification: send attempt %d failed for channel %s: %v", attempt+1, channelID, lastErr)
	}

	status := "sent"
	errMsg := ""
	if lastErr != nil {
		status = "failed"
		errMsg = lastErr.Error()
	}
	if logErr := u.repo.LogNotification(ctx, &domain.NotificationLog{
		ChannelID: channelID,
		MonitorID: monitorID,
		Event:     event,
		Status:    status,
		ErrorMsg:  errMsg,
	}); logErr != nil {
		log.Printf("notification: LogNotification failed: %v", logErr)
	}
}

func (u *NotificationUsecase) NotifyReminders(ctx context.Context) error {
	targets, err := u.repo.FindReminders(ctx)
	if err != nil {
		return err
	}
	for _, t := range targets {
		u.notifyChannel(ctx, t.MonitorID, t.ChannelID, domain.EventDown)
	}
	return nil
}

func (u *NotificationUsecase) CreateChannel(ctx context.Context, ch *domain.NotificationChannel) error {
	return u.repo.CreateChannel(ctx, ch)
}
func (u *NotificationUsecase) UpdateChannel(ctx context.Context, ch *domain.NotificationChannel) error {
	return u.repo.UpdateChannel(ctx, ch)
}
func (u *NotificationUsecase) DeleteChannel(ctx context.Context, id string) error {
	return u.repo.DeleteChannel(ctx, id)
}
func (u *NotificationUsecase) ListChannels(ctx context.Context) ([]*domain.NotificationChannel, error) {
	return u.repo.ListChannels(ctx)
}
func (u *NotificationUsecase) AssignChannel(ctx context.Context, monitorID, channelID string) error {
	return u.repo.AssignChannel(ctx, monitorID, channelID)
}
func (u *NotificationUsecase) UnassignChannel(ctx context.Context, monitorID, channelID string) error {
	return u.repo.UnassignChannel(ctx, monitorID, channelID)
}
func (u *NotificationUsecase) GetChannelsForMonitor(ctx context.Context, monitorID string) ([]*domain.NotificationChannel, error) {
	return u.repo.GetChannelsForMonitor(ctx, monitorID)
}
func (u *NotificationUsecase) ListLogs(ctx context.Context, channelID string) ([]*domain.NotificationLog, error) {
	return u.repo.ListLogs(ctx, channelID)
}

func (u *NotificationUsecase) SendTest(ctx context.Context, channelID string, monitor *domain.Monitor) error {
	ch, err := u.repo.GetChannel(ctx, channelID)
	if err != nil {
		return err
	}
	return u.sender.Send(ctx, ch, domain.EventDown, monitor)
}
