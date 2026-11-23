package handlers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestTransactionRejectsInvalidProgramData(t *testing.T) {
	handler := NewTransactionHandler(nil, nil)
	router := gin.New()
	router.POST("/card", handler.MakeTransactionByCard)
	router.POST("/cash", handler.MakeTransactionByCash)
	router.POST("/paypass", handler.MakeTransactionByPaypass)
	for _, path := range []string{"/card", "/cash", "/paypass"} {
		for _, programs := range []string{
			`[]`,
			`[{"id":1,"amount":-1}]`,
			`[{"id":1,"amount":1,"discount_per_cent":101}]`,
		} {
			request := httptest.NewRequest("POST", path, strings.NewReader(`{"card_uid":"test-card","programs":`+programs+`}`))
			request.Header.Set("Content-Type", "application/json")
			recorder := httptest.NewRecorder()
			router.ServeHTTP(recorder, request)
			if recorder.Code != http.StatusBadRequest {
				t.Errorf("%s with programs %s returned %d", path, programs, recorder.Code)
			}
		}
	}
}
