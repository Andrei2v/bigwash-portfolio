package ws

import (
	"net/http"

	"database/internal/middleware"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return middleware.OriginAllowed(r.Header.Get("Origin"))
	},
}

func ServeWS(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	client := NewClient(hub, conn)
	hub.Register <- client

	go client.WritePump()
	go client.ReadPump()
}
