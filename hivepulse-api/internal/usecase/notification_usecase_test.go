package usecase_test

import (
	"context"
	"errors"
	"testing"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/usecase"
	"github.com/beedevz/hivepulse/internal/usecase/mocks"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func TestNotify_GlobalChannels(t *testing.T) {
	repo := mocks.NewNotificationRepository(t)
	sender := mocks.NewNotificationSender(t)

	monitor := &domain.Monitor{ID: "m1", Name: "API", CheckType: domain.CheckHTTP}
	ch := &domain.NotificationChannel{ID: "ch1", Type: domain.ChannelEmail, Enabled: true, IsGlobal: true, Config: map[string]string{"to": "a@b.com"}}

	repo.On("GetChannelsForMonitor", mock.Anything, "m1").Return([]*domain.NotificationChannel{ch}, nil)
	repo.On("GetChannel", mock.Anything, "ch1").Return(ch, nil)
	sender.On("Send", mock.Anything, ch, domain.EventDown, mock.Anything).Return(nil)
	repo.On("LogNotification", mock.Anything, mock.MatchedBy(func(l *domain.NotificationLog) bool {
		return l.Status == "sent" && l.Event == domain.EventDown
	})).Return(nil)

	monitorRepo := mocks.NewMonitorRepository(t)
	monitorRepo.On("FindByID", mock.Anything, "m1").Return(monitor, nil)

	uc := usecase.NewNotificationUsecase(repo, sender, monitorRepo)
	uc.Notify(context.Background(), "m1", domain.EventDown)

	sender.AssertCalled(t, "Send", mock.Anything, ch, domain.EventDown, mock.Anything)
	repo.AssertCalled(t, "LogNotification", mock.Anything, mock.Anything)
}

func TestNotify_RetriesOnFailure(t *testing.T) {
	repo := mocks.NewNotificationRepository(t)
	sender := mocks.NewNotificationSender(t)

	monitor := &domain.Monitor{ID: "m1", Name: "API"}
	ch := &domain.NotificationChannel{ID: "ch1", Type: domain.ChannelWebhook, Enabled: true, Config: map[string]string{"url": "http://x"}}

	repo.On("GetChannelsForMonitor", mock.Anything, "m1").Return([]*domain.NotificationChannel{ch}, nil)
	repo.On("GetChannel", mock.Anything, "ch1").Return(ch, nil)
	sender.On("Send", mock.Anything, ch, domain.EventDown, mock.Anything).Return(errors.New("timeout")).Once()
	sender.On("Send", mock.Anything, ch, domain.EventDown, mock.Anything).Return(errors.New("timeout")).Once()
	sender.On("Send", mock.Anything, ch, domain.EventDown, mock.Anything).Return(nil).Once()
	repo.On("LogNotification", mock.Anything, mock.MatchedBy(func(l *domain.NotificationLog) bool {
		return l.Status == "sent"
	})).Return(nil)

	monitorRepo := mocks.NewMonitorRepository(t)
	monitorRepo.On("FindByID", mock.Anything, "m1").Return(monitor, nil)

	uc := usecase.NewNotificationUsecase(repo, sender, monitorRepo)
	uc.Notify(context.Background(), "m1", domain.EventDown)

	assert.Equal(t, 3, len(sender.Calls))
}

func TestNotify_LogsFailedAfter3Attempts(t *testing.T) {
	repo := mocks.NewNotificationRepository(t)
	sender := mocks.NewNotificationSender(t)

	monitor := &domain.Monitor{ID: "m1", Name: "API"}
	ch := &domain.NotificationChannel{ID: "ch1", Type: domain.ChannelSlack, Enabled: true, Config: map[string]string{}}

	repo.On("GetChannelsForMonitor", mock.Anything, "m1").Return([]*domain.NotificationChannel{ch}, nil)
	repo.On("GetChannel", mock.Anything, "ch1").Return(ch, nil)
	sender.On("Send", mock.Anything, ch, domain.EventDown, mock.Anything).Return(errors.New("fail"))
	repo.On("LogNotification", mock.Anything, mock.MatchedBy(func(l *domain.NotificationLog) bool {
		return l.Status == "failed"
	})).Return(nil)

	monitorRepo := mocks.NewMonitorRepository(t)
	monitorRepo.On("FindByID", mock.Anything, "m1").Return(monitor, nil)

	uc := usecase.NewNotificationUsecase(repo, sender, monitorRepo)
	uc.Notify(context.Background(), "m1", domain.EventDown)

	repo.AssertCalled(t, "LogNotification", mock.Anything, mock.MatchedBy(func(l *domain.NotificationLog) bool {
		return l.Status == "failed"
	}))
}

var _ = require.New // prevent unused import
