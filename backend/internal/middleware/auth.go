package middleware

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"database/internal/database/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization header required"})
			c.Abort()
			return
		}

		// Извлекаем токен из "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization header format"})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// Парсим токен
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		}, jwt.WithJSONNumber(), jwt.WithExpirationRequired(), jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))

		if jwtSecret == "" || err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}

		// Validate claims before casting: malformed tokens must never panic the API.
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok || claims["kind"] != "admin" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
			return
		}
		userID, idOK := positiveID(claims["user_id"])
		role, roleOK := claims["role"].(string)
		if !idOK || !roleOK || role == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
			return
		}
		c.Set("user_id", userID)
		c.Set("role", role)
		expires, _ := claims.GetExpirationTime()
		c.Set("token_expires", expires.Time)
		c.Next()
	}
}

func RequireStaff(db *gorm.DB, ownerOnly bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		allowed, err := StaffAccess(c.Request.Context(), db, c.GetUint("user_id"), ownerOnly)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "database error"})
			return
		}
		if !allowed {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "insufficient access"})
			return
		}
		c.Next()
	}
}

func StaffAccess(ctx context.Context, db *gorm.DB, userID uint, ownerOnly bool) (bool, error) {
	var admin models.Admin
	err := db.WithContext(ctx).Preload("Role").First(&admin, userID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return admin.IsActive && staffRoleAllowed(admin.Role.Name, ownerOnly), nil
}

func staffRoleAllowed(role string, ownerOnly bool) bool {
	switch role {
	case "owner", "Власник":
		return true
	case "admin", "Адмін":
		return !ownerOnly
	default:
		return false
	}
}

func positiveID(claim any) (uint, bool) {
	number, ok := claim.(json.Number)
	if !ok {
		return 0, false
	}
	id, err := strconv.ParseUint(number.String(), 10, strconv.IntSize)
	return uint(id), err == nil && id > 0
}
