package handler

import (
	"context"
	"net/http"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/gin-gonic/gin"
)

// NotificationService abstracts NotificationUsecase for the handler.
type NotificationService interface {
	CreateChannel(ctx context.Context, ch *domain.NotificationChannel) error
	UpdateChannel(ctx context.Context, ch *domain.NotificationChannel) error
	DeleteChannel(ctx context.Context, id string) error
	ListChannels(ctx context.Context) ([]*domain.NotificationChannel, error)
	GetChannelsForMonitor(ctx context.Context, monitorID string) ([]*domain.NotificationChannel, error)
	AssignChannel(ctx context.Context, monitorID, channelID string) error
	UnassignChannel(ctx context.Context, monitorID, channelID string) error
	ListLogs(ctx context.Context, channelID string) ([]*domain.NotificationLog, error)
	SendTest(ctx context.Context, channelID string, monitor *domain.Monitor) error
}

type NotificationHandler struct{ svc NotificationService }

func NewNotificationHandler(svc NotificationService) *NotificationHandler {
	return &NotificationHandler{svc: svc}
}

type channelWriteRequest struct {
	Name              string            `json:"name"    binding:"required"`
	Type              string            `json:"type"    binding:"required"`
	Config            map[string]string `json:"config"`
	IsGlobal          bool              `json:"is_global"`
	Enabled           *bool             `json:"enabled"`
	RemindIntervalMin int               `json:"remind_interval_min"`
}

type channelResponse struct {
	ID                string            `json:"id"`
	Name              string            `json:"name"`
	Type              string            `json:"type"`
	Config            map[string]string `json:"config"`
	IsGlobal          bool              `json:"is_global"`
	Enabled           bool              `json:"enabled"`
	RemindIntervalMin int               `json:"remind_interval_min"`
	CreatedAt         string            `json:"created_at"`
}

func maskConfig(ch *domain.NotificationChannel) map[string]string {
	out := make(map[string]string, len(ch.Config))
	for k, v := range ch.Config {
		if k == "secret" || k == "webhook_url" {
			out[k] = "***"
		} else {
			out[k] = v
		}
	}
	return out
}

func toChannelResponse(ch *domain.NotificationChannel) channelResponse {
	return channelResponse{
		ID: ch.ID, Name: ch.Name, Type: string(ch.Type),
		Config: maskConfig(ch), IsGlobal: ch.IsGlobal, Enabled: ch.Enabled,
		RemindIntervalMin: ch.RemindIntervalMin,
		CreatedAt:         ch.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

func (h *NotificationHandler) List(c *gin.Context) {
	channels, err := h.svc.ListChannels(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	resp := make([]channelResponse, len(channels))
	for i, ch := range channels {
		resp[i] = toChannelResponse(ch)
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

func (h *NotificationHandler) Create(c *gin.Context) {
	var req channelWriteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	enabled := true
	if req.Enabled != nil {
		enabled = *req.Enabled
	}
	ch := &domain.NotificationChannel{
		Name: req.Name, Type: domain.ChannelType(req.Type),
		Config: req.Config, IsGlobal: req.IsGlobal,
		Enabled: enabled, RemindIntervalMin: req.RemindIntervalMin,
	}
	if err := h.svc.CreateChannel(c.Request.Context(), ch); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, toChannelResponse(ch))
}

func (h *NotificationHandler) Update(c *gin.Context) {
	var req channelWriteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	cfg := make(map[string]string)
	for k, v := range req.Config {
		if v != "***" {
			cfg[k] = v
		}
	}
	enabled := true
	if req.Enabled != nil {
		enabled = *req.Enabled
	}
	ch := &domain.NotificationChannel{
		ID: c.Param("id"), Name: req.Name, Type: domain.ChannelType(req.Type),
		Config: cfg, IsGlobal: req.IsGlobal,
		Enabled: enabled, RemindIntervalMin: req.RemindIntervalMin,
	}
	if err := h.svc.UpdateChannel(c.Request.Context(), ch); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "channel updated"})
}

func (h *NotificationHandler) Delete(c *gin.Context) {
	if err := h.svc.DeleteChannel(c.Request.Context(), c.Param("id")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *NotificationHandler) Logs(c *gin.Context) {
	logs, err := h.svc.ListLogs(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": logs})
}

func (h *NotificationHandler) ListMonitorChannels(c *gin.Context) {
	channels, err := h.svc.GetChannelsForMonitor(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	resp := make([]channelResponse, len(channels))
	for i, ch := range channels {
		resp[i] = toChannelResponse(ch)
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

func (h *NotificationHandler) AssignChannel(c *gin.Context) {
	if err := h.svc.AssignChannel(c.Request.Context(), c.Param("id"), c.Param("chID")); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusCreated)
}

func (h *NotificationHandler) UnassignChannel(c *gin.Context) {
	if err := h.svc.UnassignChannel(c.Request.Context(), c.Param("id"), c.Param("chID")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *NotificationHandler) TestChannel(c *gin.Context) {
	testMonitor := &domain.Monitor{
		ID:   "test",
		Name: "Test Monitor (HivePulse Test)",
		URL:  "https://example.com",
	}
	if err := h.svc.SendTest(c.Request.Context(), c.Param("id"), testMonitor); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "test notification sent"})
}
