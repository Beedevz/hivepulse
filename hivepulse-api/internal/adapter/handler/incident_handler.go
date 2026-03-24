package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/beedevz/hivepulse/internal/domain"
	"github.com/beedevz/hivepulse/internal/port"
	"github.com/gin-gonic/gin"
)

type IncidentHandler struct {
	repo port.IncidentRepository
}

func NewIncidentHandler(repo port.IncidentRepository) *IncidentHandler {
	return &IncidentHandler{repo: repo}
}

type incidentResponse struct {
	ID          int64   `json:"id"`
	MonitorID   string  `json:"monitor_id"`
	MonitorName string  `json:"monitor_name"`
	StartedAt   string  `json:"started_at"`
	ResolvedAt  *string `json:"resolved_at"`
	DurationS   int     `json:"duration_s"`
	ErrorMsg    string  `json:"error_msg"`
}

func toIncidentResponse(inc *domain.Incident) incidentResponse {
	var resolvedAt *string
	var durationS int
	if inc.ResolvedAt != nil {
		s := inc.ResolvedAt.Format(time.RFC3339)
		resolvedAt = &s
		durationS = int(inc.ResolvedAt.Sub(inc.StartedAt).Seconds())
	} else {
		durationS = int(time.Since(inc.StartedAt).Seconds())
	}
	return incidentResponse{
		ID:          inc.ID,
		MonitorID:   inc.MonitorID,
		MonitorName: inc.MonitorName,
		StartedAt:   inc.StartedAt.Format(time.RFC3339),
		ResolvedAt:  resolvedAt,
		DurationS:   durationS,
		ErrorMsg:    inc.ErrorMsg,
	}
}

// List godoc
// @Summary      List incidents
// @Tags         incidents
// @Security     Bearer
// @Param        status query string false "Filter: active|resolved|all" default(all)
// @Param        limit  query int    false "Max results" default(100)
// @Produce      json
// @Success      200 {object} map[string]interface{}
// @Router       /incidents [get]
func (h *IncidentHandler) List(c *gin.Context) {
	status := c.DefaultQuery("status", "all")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	if limit < 1 || limit > 200 {
		limit = 100
	}

	var incidents []*domain.Incident
	var err error

	switch status {
	case "active":
		incidents, err = h.repo.FindActive(c.Request.Context())
	case "resolved":
		incidents, err = h.repo.FindResolved(c.Request.Context(), limit)
	default:
		incidents, err = h.repo.FindRecent(c.Request.Context(), limit)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	data := make([]incidentResponse, len(incidents))
	for i, inc := range incidents {
		data[i] = toIncidentResponse(inc)
	}
	c.JSON(http.StatusOK, gin.H{"data": data, "total": len(data)})
}
