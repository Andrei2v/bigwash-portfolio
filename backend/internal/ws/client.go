package ws

import (
	"log"

	"github.com/gorilla/websocket"
)

type Client struct {
	hub  *Hub
	conn *websocket.Conn
	send chan Message
}

func NewClient(hub *Hub, conn *websocket.Conn) *Client {
	return &Client{
		hub:  hub,
		conn: conn,
		send: make(chan Message),
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
		if err := c.conn.WriteJSON(msg); err != nil {
			log.Println("ws write error:", err)
			return
		}
	}
}
