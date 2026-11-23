package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"database/internal/config"
	"database/internal/ws"

	"github.com/gin-gonic/gin"
)

func TestPrivateRoutesRequireAuthentication(t *testing.T) {
	t.Setenv("BIGWASH_ENABLE_WS", "true")
	t.Setenv("BIGWASH_ENABLE_REGISTRATION", "true")
	t.Setenv("BIGWASH_ENABLE_DEBUG_SEED", "true")
	for _, localDev := range []bool{false, true} {
		router := gin.New()
		setupRoutes(router, nil, ws.NewHub(), &config.Config{
			LocalDev: localDev, JWTSecret: "test-only-signing-key-with-no-production-use",
		})
		seedStatus := http.StatusNotFound
		if localDev {
			seedStatus = http.StatusUnauthorized
		}
		for _, tc := range []struct {
			method, path string
			status       int
		}{
			{"GET", "/api/v1/clients", http.StatusUnauthorized},
			{"DELETE", "/api/v1/admins/1", http.StatusUnauthorized},
			{"GET", "/api/v1/debug/seed", http.StatusNotFound},
			{"POST", "/api/v1/debug/seed", seedStatus},
			{"GET", "/api/v1/ws", http.StatusUnauthorized},
		} {
			request := httptest.NewRequest(tc.method, tc.path, nil)
			if tc.path == "/api/v1/ws" {
				request.Header.Set("Connection", "Upgrade")
				request.Header.Set("Upgrade", "websocket")
			}
			recorder := httptest.NewRecorder()
			router.ServeHTTP(recorder, request)
			if recorder.Code != tc.status {
				t.Errorf("local=%v %s %s returned %d, want %d", localDev, tc.method, tc.path, recorder.Code, tc.status)
			}
		}
		if !localDev {
			recorder := httptest.NewRecorder()
			router.ServeHTTP(recorder, httptest.NewRequest("POST", "/api/v1/auth/register", nil))
			if recorder.Code != http.StatusNotFound {
				t.Errorf("production registration returned %d", recorder.Code)
			}
		}
	}
}
