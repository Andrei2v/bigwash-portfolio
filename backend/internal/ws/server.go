package ws

import (
	"context"
	"net/http"
	"time"

	"database/internal/middleware"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	Subprotocols: []string{"bigwash.v1"},
	CheckOrigin: func(r *http.Request) bool {
		return middleware.OriginAllowed(r.Header.Get("Origin"))
	},
}

func ServeWS(hub *Hub, w http.ResponseWriter, r *http.Request, expires time.Time, authorized func(context.Context) bool) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	conn.SetReadLimit(4096)
	_ = conn.SetReadDeadline(expires)
	client := NewClient(hub, conn, authorized)
	hub.Register <- client

	go client.WritePump()
	go client.ReadPump()
}
