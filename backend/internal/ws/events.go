package ws

import (
	"encoding/json"
	"log"
	"time"
)

// EventType - типи подій
type EventType string

const (
	// Panel Events
	EventPanelCreated      EventType = "panel.created"
	EventPanelUpdated      EventType = "panel.updated"
	EventPanelDeleted      EventType = "panel.deleted"
	EventPanelStatusChange EventType = "panel.status_changed"
	EventPanelPing         EventType = "panel.ping"
	
	// Transaction Events
	EventTransactionNew  EventType = "transaction.new"
	EventTransactionCard EventType = "transaction.card"
	EventTransactionCash EventType = "transaction.cash"
	
	// Program Events
	EventProgramCreated EventType = "program.created"
	EventProgramUpdated EventType = "program.updated"
	EventProgramDeleted EventType = "program.deleted"
	
	// Card Events (існуючі)
	EventCardCreated       EventType = "card.created"
	EventCardBalanceChange EventType = "card.balance_changed"
	
	// Card Events (НОВІ!)
	EventCardUpdated EventType = "card.updated"
	EventCardDeleted EventType = "card.deleted"
	EventCardBlocked EventType = "card.blocked"
	
	// Car Wash Events
	EventCarWashCreated EventType = "carwash.created"
	EventCarWashUpdated EventType = "carwash.updated"
	
	// System Events
	EventSystemAlert        EventType = "system.alert"
	EventSystemNotification EventType = "system.notification"
)

// Event - структура події
type Event struct {
	Type      EventType   `json:"type"`
	Data      interface{} `json:"data"`
	Timestamp time.Time   `json:"timestamp"`
	Source    string      `json:"source,omitempty"`
}

// NewEvent - створити нову подію
func NewEvent(eventType EventType, data interface{}) Event {
	return Event{
		Type:      eventType,
		Data:      data,
		Timestamp: time.Now(),
	}
}

// Broadcast - відправити подію всім підключеним клієнтам
func (h *Hub) BroadcastEvent(event Event) {
	eventJSON, err := json.Marshal(event)
	if err != nil {
		log.Printf("Failed to marshal event: %v", err)
		return
	}

	message := Message{
		Type: string(event.Type),
		Data: string(eventJSON),
	}

	h.Broadcast <- message
}

// BroadcastToRoom - відправити в конкретну "кімнату" (наприклад, тільки адмінам)
func (h *Hub) BroadcastToRoom(room string, event Event) {
	// TODO: реалізувати rooms для фільтрації клієнтів
	h.BroadcastEvent(event)
}