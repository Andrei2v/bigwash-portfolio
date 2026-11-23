package ws

import (
	"context"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

type Client struct {
	hub        *Hub
	conn       *websocket.Conn
	send       chan Message
	authorized func(context.Context) bool
}

func NewClient(hub *Hub, conn *websocket.Conn, authorized func(context.Context) bool) *Client {
	return &Client{
		hub:        hub,
		conn:       conn,
		send:       make(chan Message, 32),
		authorized: authorized,
	}
}

func (c *Client) ReadPump() {
	defer func() {
		c.hub.Unregister <- c
		c.conn.Close()
	}()

	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

func (c *Client) WritePump() {
	defer c.conn.Close()

	for msg := range c.send {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		allowed := c.authorized(ctx)
		cancel()
		if !allowed {
			return
		}
		_ = c.conn.SetWriteDeadline(time.Now().Add(5 * time.Second))
		if err := c.conn.WriteJSON(msg); err != nil {
			log.Println("ws write error:", err)
			return
		}
	}
}
