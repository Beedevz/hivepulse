package handler

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/usecase"
	"github.com/gin-gonic/gin"
)

// MonitorService abstracts the monitor usecase for testability.
type MonitorService interface {
	ListMonitors(ctx context.Context, page, limit int) ([]*domain.Monitor, int64, error)
	GetMonitor(ctx context.Context, id string) (*domain.Monitor, error)
	CreateMonitor(ctx context.Context, userID string, req usecase.MonitorRequest) error
	UpdateMonitor(ctx context.Context, id string, req usecase.MonitorRequest) error
	DeleteMonitor(ctx context.Context, id string) error
}

type MonitorHandler struct{ svc MonitorService }

func NewMonitorHandler(svc MonitorService) *MonitorHandler { return &MonitorHandler{svc: svc} }

type monitorResponse struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	CheckType  string  `json:"check_type"`
	Interval   int     `json:"interval"`
	Timeout    int     `json:"timeout"`
	Enabled    bool    `json:"enabled"`
	URL        string  `json:"url,omitempty"`
	Host       string  `json:"host,omitempty"`
	Port       int     `json:"port,omitempty"`
	PingHost   string  `json:"ping_host,omitempty"`
	DNSHost    string  `json:"dns_host,omitempty"`
	LastStatus string  `json:"last_status"`
	Uptime24h  float64 `json:"uptime_24h"`
	CreatedAt  string  `json:"created_at"`
}

func toMonitorResponse(m *domain.Monitor) monitorResponse {
	createdAt := ""
	if !m.CreatedAt.IsZero() {
		createdAt = m.CreatedAt.Format(time.RFC3339)
	}
	return monitorResponse{
		ID: m.ID, Name: m.Name, CheckType: string(m.CheckType),
		Interval: m.Interval, Timeout: m.Timeout, Enabled: m.Enabled,
		URL: m.URL, Host: m.Host, Port: m.Port, PingHost: m.PingHost, DNSHost: m.DNSHost,
		LastStatus: "unknown", Uptime24h: 0.0, CreatedAt: createdAt,
	}
}

// List godoc
// @Summary      List monitors
// @Tags         monitors
// @Security     Bearer
// @Produce      json
// @Param        page  query int false "Page number" default(1)
// @Param        limit query int false "Items per page" default(20)
// @Success      200 {object} map[string]interface{}
// @Failure      401 {object} map[string]string
// @Router       /monitors [get]
func (h *MonitorHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	monitors, total, err := h.svc.ListMonitors(c.Request.Context(), page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	data := make([]monitorResponse, len(monitors))
	for i, m := range monitors {
		data[i] = toMonitorResponse(m)
	}
	c.JSON(http.StatusOK, gin.H{"data": data, "total": total, "page": page, "limit": limit})
}

// Get godoc
// @Summary      Get monitor by ID
// @Tags         monitors
// @Security     Bearer
// @Param        id path string true "Monitor ID"
// @Produce      json
// @Success      200 {object} map[string]interface{}
// @Failure      404 {object} map[string]string
// @Router       /monitors/{id} [get]
func (h *MonitorHandler) Get(c *gin.Context) {
	m, err := h.svc.GetMonitor(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, toMonitorResponse(m))
}

type monitorWriteRequest struct {
	Name          string `json:"name"         binding:"required"`
	CheckType     string `json:"check_type"   binding:"required"`
	Interval      int    `json:"interval"     binding:"required"`
	Timeout       int    `json:"timeout"`
	Retries       int    `json:"retries"`
	RetryInterval int    `json:"retry_interval"`
	Enabled       *bool  `json:"enabled"`
	URL             string `json:"url"`
	Method          string `json:"method"`
	ExpectedStatus  int    `json:"expected_status"`
	RequestHeaders  string `json:"request_headers"`
	RequestBody     string `json:"request_body"`
	FollowRedirects *bool  `json:"follow_redirects"`
	Host          string `json:"host"`
	Port          int    `json:"port"`
	PingHost      string `json:"ping_host"`
	PacketCount   int    `json:"packet_count"`
	DNSHost       string `json:"dns_host"`
	RecordType    string `json:"record_type"`
	ExpectedValue string `json:"expected_value"`
	DNSServer     string `json:"dns_server"`
}

func toMonitorRequest(req monitorWriteRequest) usecase.MonitorRequest {
	enabled := true
	if req.Enabled != nil {
		enabled = *req.Enabled
	}
	followRedirects := true
	if req.FollowRedirects != nil {
		followRedirects = *req.FollowRedirects
	}
	return usecase.MonitorRequest{
		Name: req.Name, CheckType: req.CheckType, Interval: req.Interval,
		Timeout: req.Timeout, Retries: req.Retries, RetryInterval: req.RetryInterval,
		Enabled: enabled, URL: req.URL, Method: req.Method, ExpectedStatus: req.ExpectedStatus,
		RequestHeaders: req.RequestHeaders, RequestBody: req.RequestBody, FollowRedirects: followRedirects,
		Host: req.Host, Port: req.Port, PingHost: req.PingHost, PacketCount: req.PacketCount,
		DNSHost: req.DNSHost, RecordType: req.RecordType, ExpectedValue: req.ExpectedValue, DNSServer: req.DNSServer,
	}
}

// Create godoc
// @Summary      Create monitor
// @Tags         monitors
// @Security     Bearer
// @Accept       json
// @Produce      json
// @Param        body body monitorWriteRequest true "Monitor payload"
// @Success      201 {object} map[string]string
// @Failure      400 {object} map[string]string
// @Failure      403 {object} map[string]string
// @Router       /monitors [post]
func (h *MonitorHandler) Create(c *gin.Context) {
	var req monitorWriteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID, _ := c.Get("userID")
	if err := h.svc.CreateMonitor(c.Request.Context(), userID.(string), toMonitorRequest(req)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "monitor created"})
}

// Update godoc
// @Summary      Update monitor
// @Tags         monitors
// @Security     Bearer
// @Accept       json
// @Param        id path string true "Monitor ID"
// @Param        body body monitorWriteRequest true "Monitor payload"
// @Success      200 {object} map[string]string
// @Failure      400 {object} map[string]string
// @Failure      403 {object} map[string]string
// @Router       /monitors/{id} [put]
func (h *MonitorHandler) Update(c *gin.Context) {
	var req monitorWriteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.UpdateMonitor(c.Request.Context(), c.Param("id"), toMonitorRequest(req)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "monitor updated"})
}

// Delete godoc
// @Summary      Delete monitor
// @Tags         monitors
// @Security     Bearer
// @Param        id path string true "Monitor ID"
// @Success      204
// @Failure      403 {object} map[string]string
// @Failure      404 {object} map[string]string
// @Router       /monitors/{id} [delete]
func (h *MonitorHandler) Delete(c *gin.Context) {
	if err := h.svc.DeleteMonitor(c.Request.Context(), c.Param("id")); err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	c.Status(http.StatusNoContent)
}
