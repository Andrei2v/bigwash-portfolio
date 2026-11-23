package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// PanelAuthMiddleware - middleware для авторизации пультов
func PanelAuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"status":  401,
				"message": "authorization header required",
			})
			c.Abort()
			return
		}

		// Извлекаем токен из "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"status":  401,
				"message": "invalid authorization header format",
			})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// Парсим токен
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		}, jwt.WithJSONNumber(), jwt.WithExpirationRequired(), jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))

		if jwtSecret == "" || err != nil || !token.Valid {
			c.JSON(http.StatusForbidden, gin.H{
				"status":  403,
				"message": "Card token is invalid",
			})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok || claims["kind"] != "panel" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid panel claims"})
			return
		}
		panelID, panelOK := positiveID(claims["panel_id"])
		carWashID, washOK := positiveID(claims["car_wash_id"])
		if !panelOK || !washOK {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid panel claims"})
			return
		}
		c.Set("panel_id", panelID)
		c.Set("car_wash_id", carWashID)
		c.Next()
	}
}
