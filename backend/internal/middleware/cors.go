package middleware

import (
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

// OriginAllowed accepts only explicit frontend Origins. Keep production Origins
// in BIGWASH_ALLOWED_ORIGINS as a comma-separated list of exact scheme+host+port.
func OriginAllowed(origin string) bool {
	if origin == "" {
		return false
	}
	allowed := os.Getenv("BIGWASH_ALLOWED_ORIGINS")
	if allowed == "" {
		allowed = "http://localhost:5173"
	}
	for _, candidate := range strings.Split(allowed, ",") {
		if origin == strings.TrimSpace(candidate) {
			return true
		}
	}
	return false
}

func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if OriginAllowed(origin) {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.Writer.Header().Set("Vary", "Origin")
			c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, Authorization, X-Requested-With")
			c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")
		}
		if c.Request.Method == "OPTIONS" {
			if origin != "" && !OriginAllowed(origin) {
				c.AbortWithStatus(403)
				return
			}
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
