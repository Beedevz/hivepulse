package port

import (
	"context"
	"github.com/beedevz/hivepulse/internal/domain"
)

type UserRepository interface {
	Create(ctx context.Context, user *domain.User) error
	FindByEmail(ctx context.Context, email string) (*domain.User, error)
	FindByID(ctx context.Context, id string) (*domain.User, error)
	Count(ctx context.Context) (int64, error)
	List(ctx context.Context, page, limit int) ([]*domain.User, int64, error)
	UpdateRole(ctx context.Context, id string, role domain.Role) error
	Delete(ctx context.Context, id string) error
}

type TokenRepository interface {
	Create(ctx context.Context, token *domain.RefreshToken) error
	FindByHash(ctx context.Context, hash string) (*domain.RefreshToken, error)
	DeleteByHash(ctx context.Context, hash string) error
	DeleteExpired(ctx context.Context) error
}

type MonitorRepository interface {
	Create(ctx context.Context, m *domain.Monitor) error
	FindByID(ctx context.Context, id string) (*domain.Monitor, error)
	FindAll(ctx context.Context, page, limit int) ([]*domain.Monitor, int64, error)
	Update(ctx context.Context, m *domain.Monitor) error
	Delete(ctx context.Context, id string) error
}
