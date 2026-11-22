package handlers

import (
	"net/http"
	"time"

	"database/internal/database/models"
	"database/internal/ws"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CardHandler struct {
	db  *gorm.DB
	hub *ws.Hub
}

func NewCardHandler(db *gorm.DB, hub *ws.Hub) *CardHandler {
	return &CardHandler{db: db, hub: hub}
}

// ============================================================================
// ІСНУЮЧІ МЕТОДИ ДЛЯ ПУЛЬТІВ
// ============================================================================

// GetCardInfo - GET /api/card/info/:uuid
// Отримати інформацію про карту (для пультів)
func (h *CardHandler) GetCardInfo(c *gin.Context) {
	cardUID := c.Param("uuid")

	var card models.Card
	if err := h.db.Preload("User").Preload("CardGroup").First(&card, "uid = ?", cardUID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  404,
			"message": "Card not found",
		})
		return
	}

	if card.IsBlocked {
		c.JSON(http.StatusNotAcceptable, gin.H{
			"status":  406,
			"message": "Card blocked",
		})
		return
	}

	response := gin.H{
		"card": gin.H{
			"firstname":     getStringValue(card.User, "Firstname"),
			"lastname":      getStringValue(card.User, "Lastname"),
			"card_balance":  card.Amount,
			"wasGlobalSave": card.WasGlobalSave,
			"card_discount": card.Discount,
			"type":          card.Type,
		},
	}

	if card.User != nil && card.User.TagID != nil {
		response["card"].(gin.H)["tag_id"] = *card.User.TagID
	}

	if card.CardGroupID != nil {
		response["card"].(gin.H)["group_id"] = *card.CardGroupID
	}

	c.JSON(http.StatusOK, response)
}

// GetClientByCard - GET /api/get/client/by/card
func (h *CardHandler) GetClientByCard(c *gin.Context) {
	var req struct {
		CardUID string `json:"card_uid" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var card models.Card
	if err := h.db.Preload("User").Preload("CardGroup").First(&card, "uid = ?", req.CardUID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  404,
			"message": "Card not found",
		})
		return
	}

	if card.IsBlocked {
		c.JSON(http.StatusNotAcceptable, gin.H{
			"status":  406,
			"message": "Card blocked",
		})
		return
	}

	var sumTransactions float64
	h.db.Model(&models.TransactionProgram{}).
		Joins("JOIN transactions ON transactions.id = transaction_programs.transaction_id").
		Where("transactions.card_id = ?", card.ID).
		Select("SUM(amount)").
		Scan(&sumTransactions)

	response := gin.H{
		"firstname":           getStringValue(card.User, "Firstname"),
		"lastname":            getStringValue(card.User, "Lastname"),
		"card_balance":        card.Amount,
		"wasGlobalSave":       card.WasGlobalSave,
		"card_discount":       card.Discount,
		"type":                card.Type,
		"sum_transactions":    sumTransactions,
		"total_replenishment": card.TotalReplenishment,
		"active_programs":     []int{},
	}

	if card.User != nil && card.User.TagID != nil {
		response["tag_id"] = *card.User.TagID
	}

	if card.CardGroupID != nil {
		response["group_id"] = *card.CardGroupID
	}

	c.JSON(http.StatusOK, response)
}

// CreateClientCard - POST /api/client/card/create
func (h *CardHandler) CreateClientCard(c *gin.Context) {
	var req struct {
		CardUID  string  `json:"card_uid" binding:"required"`
		Discount int     `json:"discount"`
		Balance  float64 `json:"balance" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var exists int64
	h.db.Model(&models.Card{}).Where("uid = ?", req.CardUID).Count(&exists)
	if exists > 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"message": "Card_uid already exists",
			"errors": gin.H{
				"card_uid": []string{"Card_uid already exists"},
			},
		})
		return
	}

	user := models.User{
		Firstname: "Гість",
		Lastname:  "",
		Email:     "guest_" + req.CardUID + "@bigwash.local",
		Phone:     req.CardUID,
		Password:  "no-password",
	}

	if err := h.db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	card := models.Card{
		UID:      req.CardUID,
		Type:     "default",
		Amount:   req.Balance,
		UserID:   &user.ID,
		Discount: req.Discount,
	}

	if err := h.db.Create(&card).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create card"})
		return
	}

	event := ws.NewEvent(ws.EventCardCreated, gin.H{
		"card_id":  card.ID,
		"card_uid": card.UID,
		"balance":  card.Amount,
		"user_id":  user.ID,
	})
	h.hub.BroadcastEvent(event)

	c.JSON(http.StatusOK, gin.H{
		"firstname":     user.Firstname,
		"lastname":      user.Lastname,
		"card_uid":      card.UID,
		"card_balance":  card.Amount,
		"wasGlobalSave": card.WasGlobalSave,
		"card_discount": card.Discount,
	})
}

// IncomeClientCard - POST /api/client/card/income
func (h *CardHandler) IncomeClientCard(c *gin.Context) {
	var req struct {
		CardUID string  `json:"card_uid" binding:"required"`
		Amount  float64 `json:"amount" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var card models.Card
	if err := h.db.First(&card, "uid = ?", req.CardUID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  404,
			"message": "Card not found",
		})
		return
	}

	card.Amount += req.Amount
	card.TotalReplenishment += req.Amount

	if err := h.db.Save(&card).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update card"})
		return
	}

	replenishment := models.Replenishment{
		AdminName: "System",
		Amount:    req.Amount,
		UserName:  "Client",
		CardID:    &card.ID,
		Desc:      "Поповнення через пульт",
		PayType:   "none",
		IsChecked: true,
	}

	h.db.Create(&replenishment)

	event := ws.NewEvent(ws.EventCardBalanceChange, gin.H{
		"card_id":     card.ID,
		"card_uid":    card.UID,
		"new_balance": card.Amount,
		"amount":      req.Amount,
		"operation":   "replenishment",
	})
	h.hub.BroadcastEvent(event)

	c.JSON(http.StatusOK, gin.H{
		"card_balance":  card.Amount,
		"wasGlobalSave": card.WasGlobalSave,
	})
}

// ============================================================================
// НОВІ МЕТОДИ ДЛЯ ВЕБ-ІНТЕРФЕЙСУ
// ============================================================================

// List - GET /api/v1/cards
func (h *CardHandler) List(c *gin.Context) {
	var cards []models.Card

	query := h.db.Preload("User")

	if clientID := c.Query("client_id"); clientID != "" {
		query = query.Where("user_id = ?", clientID)
	}

	if blocked := c.Query("blocked"); blocked != "" {
		query = query.Where("is_blocked = ?", blocked == "true")
	}

	if search := c.Query("search"); search != "" {
		query = query.Where("uid LIKE ?", "%"+search+"%")
	}

	if err := query.Order("created_at DESC").Find(&cards).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch cards"})
		return
	}

	responses := make([]models.CardResponse, len(cards))
	for i, card := range cards {
		responses[i] = card.ToResponse()
	}

	c.JSON(http.StatusOK, responses)
}

// Get - GET /api/v1/cards/:id
func (h *CardHandler) Get(c *gin.Context) {
	id := c.Param("id")

	var card models.Card
	if err := h.db.Preload("User").First(&card, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "card not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch card"})
		return
	}

	c.JSON(http.StatusOK, card.ToResponse())
}

// Create - POST /api/v1/cards
func (h *CardHandler) Create(c *gin.Context) {
	var req struct {
		UID      string  `json:"uid" binding:"required"`
		UserID   *uint   `json:"user_id"`
		Amount   float64 `json:"amount"`
		Discount int     `json:"discount"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var exists int64
	h.db.Model(&models.Card{}).Where("uid = ?", req.UID).Count(&exists)
	if exists > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "card with this UID already exists"})
		return
	}

	if req.UserID != nil {
		var user models.User
		if err := h.db.First(&user, *req.UserID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "client not found"})
			return
		}
	}

	card := models.Card{
		UID:       req.UID,
		UserID:    req.UserID,
		Amount:    req.Amount,
		Discount:  req.Discount,
		Type:      "default",
		IsBlocked: false,
	}

	if err := h.db.Create(&card).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create card"})
		return
	}

	h.db.Preload("User").First(&card, card.ID)

	event := ws.NewEvent(ws.EventCardCreated, gin.H{
		"card_id":  card.ID,
		"card_uid": card.UID,
		"balance":  card.Amount,
		"user_id":  card.UserID,
	})
	h.hub.BroadcastEvent(event)

	c.JSON(http.StatusCreated, card.ToResponse())
}

// Update - PUT /api/v1/cards/:id
func (h *CardHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var card models.Card
	if err := h.db.First(&card, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "card not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch card"})
		return
	}

	var req struct {
		UID       *string `json:"uid"`
		UserID    *uint   `json:"user_id"`
		Discount  *int    `json:"discount"`
		IsBlocked *bool   `json:"is_blocked"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.UID != nil {
		var exists int64
		h.db.Model(&models.Card{}).Where("uid = ? AND id != ?", *req.UID, card.ID).Count(&exists)
		if exists > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "card with this UID already exists"})
			return
		}
		card.UID = *req.UID
	}

	if req.UserID != nil {
		var user models.User
		if err := h.db.First(&user, *req.UserID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "client not found"})
			return
		}
		card.UserID = req.UserID
	}

	if req.Discount != nil {
		card.Discount = *req.Discount
	}

	if req.IsBlocked != nil {
		card.IsBlocked = *req.IsBlocked
	}

	if err := h.db.Save(&card).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update card"})
		return
	}

	h.db.Preload("User").First(&card, card.ID)

	event := ws.NewEvent(ws.EventCardUpdated, gin.H{
		"card_id":    card.ID,
		"card_uid":   card.UID,
		"is_blocked": card.IsBlocked,
	})
	h.hub.BroadcastEvent(event)

	c.JSON(http.StatusOK, card.ToResponse())
}

// Delete - DELETE /api/v1/cards/:id
func (h *CardHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	var card models.Card
	if err := h.db.First(&card, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "card not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch card"})
		return
	}

	if err := h.db.Delete(&card).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete card"})
		return
	}

	event := ws.NewEvent(ws.EventCardDeleted, gin.H{
		"card_id":  card.ID,
		"card_uid": card.UID,
	})
	h.hub.BroadcastEvent(event)

	c.JSON(http.StatusOK, gin.H{"message": "card deleted successfully"})
}

// Replenish - POST /api/v1/cards/:id/replenish
func (h *CardHandler) Replenish(c *gin.Context) {
	id := c.Param("id")

	var card models.Card
	if err := h.db.First(&card, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "card not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch card"})
		return
	}

	var req struct {
		Amount float64 `json:"amount" binding:"required,gt=0"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	card.Amount += req.Amount
	card.TotalReplenishment += req.Amount

	if err := h.db.Save(&card).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to replenish card"})
		return
	}

	replenishment := models.Replenishment{
		AdminName: "Web Admin",
		Amount:    req.Amount,
		UserName:  "Client",
		CardID:    &card.ID,
		Desc:      "Поповнення через веб-інтерфейс",
		PayType:   "none",
		IsChecked: true,
	}

	h.db.Create(&replenishment)
	h.db.Preload("User").First(&card, card.ID)

	event := ws.NewEvent(ws.EventCardBalanceChange, gin.H{
		"card_id":     card.ID,
		"card_uid":    card.UID,
		"new_balance": card.Amount,
		"amount":      req.Amount,
		"operation":   "replenishment",
	})
	h.hub.BroadcastEvent(event)

	c.JSON(http.StatusOK, card.ToResponse())
}

// Block - POST /api/v1/cards/:id/block
func (h *CardHandler) Block(c *gin.Context) {
	id := c.Param("id")

	var card models.Card
	if err := h.db.First(&card, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "card not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch card"})
		return
	}

	card.IsBlocked = !card.IsBlocked

	if err := h.db.Save(&card).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to block/unblock card"})
		return
	}

	h.db.Preload("User").First(&card, card.ID)

	event := ws.NewEvent(ws.EventCardBlocked, gin.H{
		"card_id":    card.ID,
		"card_uid":   card.UID,
		"is_blocked": card.IsBlocked,
	})
	h.hub.BroadcastEvent(event)

	c.JSON(http.StatusOK, card.ToResponse())
}

// GetStats - GET /api/v1/cards/stats
func (h *CardHandler) GetStats(c *gin.Context) {
	var stats struct {
		Total         int64   `json:"total"`
		WithoutClient int64   `json:"without_client"`
		TotalBalance  float64 `json:"total_balance"`
		BrsmCards     int64   `json:"brsm_cards"`
	}

	h.db.Model(&models.Card{}).Count(&stats.Total)
	h.db.Model(&models.Card{}).Where("user_id IS NULL").Count(&stats.WithoutClient)
	h.db.Model(&models.Card{}).Where("type = ?", "group").Count(&stats.BrsmCards)
	h.db.Model(&models.Card{}).Select("COALESCE(SUM(amount), 0)").Scan(&stats.TotalBalance)

	c.JSON(http.StatusOK, stats)
}

// UpdateLastUsed - POST /api/v1/cards/:id/last-used
func (h *CardHandler) UpdateLastUsed(c *gin.Context) {
	id := c.Param("id")

	var card models.Card
	if err := h.db.First(&card, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "card not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch card"})
		return
	}

	now := time.Now()
	card.LastUsedAt = &now

	if err := h.db.Save(&card).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update last used"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "last used updated"})
}

// ============================================================================
// HELPER ФУНКЦІЇ
// ============================================================================

func getStringValue(user *models.User, field string) string {
	if user == nil {
		return ""
	}

	switch field {
	case "Firstname":
		return user.Firstname
	case "Lastname":
		return user.Lastname
	default:
		return ""
	}
}