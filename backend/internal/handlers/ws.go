package handlers

import (
	"database/internal/ws"

	"github.com/gin-gonic/gin"
)

type WSHandler struct {
	Hub *ws.Hub
}

func NewWSHandler(hub *ws.Hub) *WSHandler {
	return &WSHandler{Hub: hub}
}

func (h *WSHandler) Handle(c *gin.Context) {
	ws.ServeWS(h.Hub, c.Writer, c.Request)
}
