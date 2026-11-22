package utils

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func GenerateToken(userID uint, role string, secret string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"role":    role,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}
// GeneratePanelToken - генерация токена для пультов
func GeneratePanelToken(panelID uint, carWashID uint, secret string) (string, error) {
	claims := jwt.MapClaims{
		"panel_id":    panelID,
		"car_wash_id": carWashID,
		"exp":         time.Now().Add(time.Hour * 24 * 365).Unix(), // токен на год
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}