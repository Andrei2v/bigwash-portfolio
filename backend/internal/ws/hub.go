package ws

type Hub struct {
	Register   chan *Client
	Unregister chan *Client
	Clients    map[*Client]bool
	Broadcast  chan Message
}

func NewHub() *Hub {
	return &Hub{
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Clients:    make(map[*Client]bool),
		Broadcast:  make(chan Message),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.Clients[client] = true

		case client := <-h.Unregister:
			delete(h.Clients, client)
			close(client.send)

		case message := <-h.Broadcast:
			for client := range h.Clients {
				client.send <- message
			}
		}
	}
}
