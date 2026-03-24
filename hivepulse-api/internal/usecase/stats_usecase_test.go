package usecase_test

import (
	"context"
	"testing"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/usecase"
	"github.com/beedevz/hivepulse/internal/usecase/mocks"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func TestGetStats_24h_UsesHourly(t *testing.T) {
	repo := mocks.NewStatsRepository(t)
	now := time.Now()
	buckets := []*domain.StatsBucket{
		{Time: now.Add(-1 * time.Hour), UpCount: 12, TotalCount: 12, AvgPingMS: 100},
	}
	repo.On("GetHourly", mock.Anything, "m1", mock.MatchedBy(func(since time.Time) bool {
		return since.After(now.Add(-25*time.Hour)) && since.Before(now.Add(-23*time.Hour))
	})).Return(buckets, nil)

	uc := usecase.NewStatsUsecase(repo)
	resp, err := uc.GetStats(context.Background(), "m1", "24h")
	require.NoError(t, err)
	assert.Equal(t, 1, len(resp.Buckets))
	assert.InDelta(t, 100.0, resp.UptimePct, 0.001)
	assert.Equal(t, 100, resp.AvgPingMS)
}

func TestGetStats_7d_UsesHourly(t *testing.T) {
	repo := mocks.NewStatsRepository(t)
	repo.On("GetHourly", mock.Anything, "m1", mock.AnythingOfType("time.Time")).Return([]*domain.StatsBucket{}, nil)

	uc := usecase.NewStatsUsecase(repo)
	resp, err := uc.GetStats(context.Background(), "m1", "7d")
	require.NoError(t, err)
	assert.Equal(t, 0.0, resp.UptimePct)
}

func TestGetStats_90d_UsesDaily(t *testing.T) {
	repo := mocks.NewStatsRepository(t)
	repo.On("GetDaily", mock.Anything, "m1", mock.AnythingOfType("time.Time")).Return([]*domain.StatsBucket{}, nil)

	uc := usecase.NewStatsUsecase(repo)
	_, err := uc.GetStats(context.Background(), "m1", "90d")
	require.NoError(t, err)
	repo.AssertCalled(t, "GetDaily", mock.Anything, "m1", mock.AnythingOfType("time.Time"))
	repo.AssertNotCalled(t, "GetHourly")
}

func TestGetStats_InvalidRange_ReturnsError(t *testing.T) {
	repo := mocks.NewStatsRepository(t)
	uc := usecase.NewStatsUsecase(repo)
	_, err := uc.GetStats(context.Background(), "m1", "99y")
	require.Error(t, err)
}

func TestGetStats_UptimePct_Calculation(t *testing.T) {
	repo := mocks.NewStatsRepository(t)
	buckets := []*domain.StatsBucket{
		{UpCount: 9, TotalCount: 10, AvgPingMS: 200},
		{UpCount: 10, TotalCount: 10, AvgPingMS: 100},
	}
	repo.On("GetHourly", mock.Anything, "m1", mock.AnythingOfType("time.Time")).Return(buckets, nil)

	uc := usecase.NewStatsUsecase(repo)
	resp, err := uc.GetStats(context.Background(), "m1", "24h")
	require.NoError(t, err)
	// (9+10)/(10+10) * 100 = 95.0
	assert.InDelta(t, 95.0, resp.UptimePct, 0.001)
	// avg of 200 and 100 = 150
	assert.Equal(t, 150, resp.AvgPingMS)
}
