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
		}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))

		if err != nil || !token.Valid {
			c.JSON(http.StatusForbidden, gin.H{
				"status":  403,
				"message": "Card token is invalid",
			})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid panel claims"})
			return
		}
		panelID, panelOK := claims["panel_id"].(float64)
		carWashID, washOK := claims["car_wash_id"].(float64)
		if !panelOK || !washOK || panelID <= 0 || carWashID <= 0 || panelID != float64(uint64(panelID)) || carWashID != float64(uint64(carWashID)) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid panel claims"})
			return
		}
		c.Set("panel_id", uint(panelID))
		c.Set("car_wash_id", uint(carWashID))
		c.Next()
	}
}
