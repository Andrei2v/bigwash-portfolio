package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"database/internal/database/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Структуры для форматирования ответа под Svelte
type TagResponse struct {
	Name  string `json:"name"`
	Color string `json:"color"`
}

type ClientResponse struct {
	ID      uint          `json:"id"`
	Name    string        `json:"name"`
	Surname string        `json:"surname"`
	Money   string        `json:"money"`
	Phone   string        `json:"phone"`
	Email   string        `json:"email"`
	Date    string        `json:"date"`
	Tags    []TagResponse `json:"tags"`
	Card    string        `json:"card"`
}

// GetClientsHandler - GET /api/v1/clients
func GetClientsHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var users []models.User

		// Достаем всех юзеров из базы
		if err := db.Find(&users).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось получить клиентов"})
			return
		}

		var result []ClientResponse

		for _, u := range users {
			// Парсим теги из JSON-строки в нормальный массив
			var tags []TagResponse
			if u.Tags != "" {
				json.Unmarshal([]byte(u.Tags), &tags)
			}
			if tags == nil {
				tags = []TagResponse{} // чтобы на фронт не летел null
			}

			// Ищем, есть ли у юзера привязанная карта
			var card models.Card
			cardUID := ""
			// Ищем карту, привязанную к user_id
			if err := db.Where("user_id = ?", u.ID).First(&card).Error; err == nil {
				cardUID = card.UID
			}

			// Собираем клиента в том формате, который ожидает Clients.svelte
			result = append(result, ClientResponse{
				ID:      u.ID,
				Name:    u.Firstname,
				Surname: u.Lastname,
				Money:   fmt.Sprintf("%.2f", u.Balance),
				Phone:   u.Phone,
				Email:   u.Email,
				Date:    u.CreatedAt.Format("02.01.2006"),
				Tags:    tags,
				Card:    cardUID,
			})
		}

		// Если база пустая, возвращаем пустой массив []
		if result == nil {
			result = []ClientResponse{}
		}

		c.JSON(http.StatusOK, result)
	}
}