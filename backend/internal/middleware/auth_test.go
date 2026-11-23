package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"database/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func TestTokensAreRestrictedToTheirAudience(t *testing.T) {
	const secret = "test-only-signing-key-with-no-production-use"
	admin, err := utils.GenerateToken(1, "owner", secret)
	if err != nil {
		t.Fatal(err)
	}
	panel, err := utils.GeneratePanelToken(1, 2, secret)
	if err != nil {
		t.Fatal(err)
	}
	router := gin.New()
	router.GET("/admin", AuthMiddleware(secret), func(c *gin.Context) { c.Status(http.StatusNoContent) })
	router.GET("/panel", PanelAuthMiddleware(secret), func(c *gin.Context) { c.Status(http.StatusNoContent) })
	for _, tc := range []struct {
		path, token string
		status      int
	}{
		{"/admin", admin, http.StatusNoContent},
		{"/panel", panel, http.StatusNoContent},
		{"/admin", panel, http.StatusUnauthorized},
		{"/panel", admin, http.StatusUnauthorized},
	} {
		request := httptest.NewRequest("GET", tc.path, nil)
		request.Header.Set("Authorization", "Bearer "+tc.token)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		if recorder.Code != tc.status {
			t.Errorf("%s returned %d, want %d", tc.path, recorder.Code, tc.status)
		}
	}
}

func TestAdminTokenRequiresExpiryAndHS256(t *testing.T) {
	const secret = "test-only-signing-key-with-no-production-use"
	router := gin.New()
	router.GET("/", AuthMiddleware(secret), func(c *gin.Context) { c.Status(http.StatusNoContent) })
	now := time.Now()
	for _, tc := range []struct {
		name    string
		method  jwt.SigningMethod
		expires int64
	}{
		{"missing expiry", jwt.SigningMethodHS256, 0},
		{"expired", jwt.SigningMethodHS256, now.Add(-time.Minute).Unix()},
		{"different algorithm", jwt.SigningMethodHS384, now.Add(time.Minute).Unix()},
	} {
		t.Run(tc.name, func(t *testing.T) {
			claims := jwt.MapClaims{"kind": "admin", "user_id": 1, "role": "owner"}
			if tc.expires != 0 {
				claims["exp"] = tc.expires
			}
			token, err := jwt.NewWithClaims(tc.method, claims).SignedString([]byte(secret))
			if err != nil {
				t.Fatal(err)
			}
			request := httptest.NewRequest("GET", "/", nil)
			request.Header.Set("Authorization", "Bearer "+token)
			recorder := httptest.NewRecorder()
			router.ServeHTTP(recorder, request)
			if recorder.Code != http.StatusUnauthorized {
				t.Errorf("returned %d, want 401", recorder.Code)
			}
		})
	}
}

func TestStaffRolePolicy(t *testing.T) {
	for _, tc := range []struct {
		role           string
		staff, isOwner bool
	}{
		{"owner", true, true}, {"Власник", true, true},
		{"admin", true, false}, {"Адмін", true, false},
		{"service", false, false}, {"Сервіс", false, false},
		{"", false, false},
	} {
		if staffRoleAllowed(tc.role, false) != tc.staff || staffRoleAllowed(tc.role, true) != tc.isOwner {
			t.Errorf("incorrect permissions for %q", tc.role)
		}
	}
}
