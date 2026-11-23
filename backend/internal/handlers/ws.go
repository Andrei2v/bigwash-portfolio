package handlers

import (
	"context"
	"time"

	"database/internal/middleware"
	"database/internal/ws"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type WSHandler struct {
	Hub *ws.Hub
	db  *gorm.DB
}

func NewWSHandler(hub *ws.Hub, db *gorm.DB) *WSHandler {
	return &WSHandler{Hub: hub, db: db}
}

func (h *WSHandler) Handle(c *gin.Context) {
	expires := c.MustGet("token_expires").(time.Time)
	userID := c.GetUint("user_id")
	ws.ServeWS(h.Hub, c.Writer, c.Request, expires, func(ctx context.Context) bool {
		allowed, err := middleware.StaffAccess(ctx, h.db, userID, false)
		return err == nil && allowed
	})
}
