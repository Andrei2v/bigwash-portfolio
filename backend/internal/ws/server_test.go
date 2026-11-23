package ws

import (
	"context"
	"errors"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

func TestWebSocketClosesBeforeSendingAnEventAfterAccessIsRevoked(t *testing.T) {
	const origin = "http://localhost:5173"
	t.Setenv("BIGWASH_ALLOWED_ORIGINS", origin)
	var hasAccess atomic.Bool
	hasAccess.Store(true)
	registered := make(chan struct{})
	hub := NewHub()
	go hub.Run()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ServeWS(hub, w, r, time.Now().Add(time.Minute), func(context.Context) bool {
			return hasAccess.Load()
		})
		close(registered)
	}))
	defer server.Close()
	url := "ws" + strings.TrimPrefix(server.URL, "http")
	conn, _, err := websocket.DefaultDialer.Dial(url, http.Header{"Origin": {origin}})
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	select {
	case <-registered:
	case <-time.After(5 * time.Second):
		t.Fatal("client registration timed out")
	}

	if err := conn.SetReadDeadline(time.Now().Add(5 * time.Second)); err != nil {
		t.Fatal(err)
	}
	hub.Broadcast <- Message{Type: "test.before"}
	var msg Message
	if err := conn.ReadJSON(&msg); err != nil || msg.Type != "test.before" {
		t.Fatalf("authorized client received %q, error %v", msg.Type, err)
	}

	hasAccess.Store(false)
	hub.Broadcast <- Message{Type: "test.after"}
	if err := conn.ReadJSON(&msg); err == nil {
		t.Fatalf("revoked client received %q", msg.Type)
	} else {
		var networkError net.Error
		if errors.As(err, &networkError) && networkError.Timeout() {
			t.Fatal("connection remained open after access was revoked")
		}
	}
}
