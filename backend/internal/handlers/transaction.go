package handlers

import (
	"net/http"

	"database/internal/database/models"
	"database/internal/ws"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type TransactionHandler struct {
	db  *gorm.DB
	hub *ws.Hub
}

func NewTransactionHandler(db *gorm.DB, hub *ws.Hub) *TransactionHandler {
	return &TransactionHandler{db: db, hub: hub}
}

type ProgramTransaction struct {
	ID              uint    `json:"id"`
	Amount          float64 `json:"amount"`
	DiscountPerCent int     `json:"discount_per_cent"`
}

// MakeTransactionByCard - POST /api/make/transaction/card
// Провести транзакцию через карту клиента
func (h *TransactionHandler) MakeTransactionByCard(c *gin.Context) {
	var req struct {
		CardUID  string               `json:"card_uid" binding:"required"`
		Programs []ProgramTransaction `json:"programs" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Получаем карту
	var card models.Card
	if err := h.db.First(&card, "uid = ?", req.CardUID).Error; err != nil {
		c.JSON(300, gin.H{
			"status":  300,
			"message": "Card not found",
		})
		return
	}

	// Проверяем заблокирована ли карта
	if card.IsBlocked {
		c.JSON(http.StatusForbidden, gin.H{
			"status":  403,
			"message": "Card is blocked",
		})
		return
	}

	// Получаем панель из контекста (устанавливается middleware)
	panelID, exists := c.Get("panel_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "panel not authenticated"})
		return
	}

	// Подсчитываем общую сумму
	var totalAmount float64
	var totalDiscount float64

	for _, prog := range req.Programs {
		discount := prog.Amount * float64(prog.DiscountPerCent) / 100
		totalAmount += prog.Amount
		totalDiscount += discount
	}

	finalAmount := totalAmount - totalDiscount

	// Проверяем достаточно ли средств
	if card.Amount < finalAmount {
		c.JSON(301, gin.H{
			"status":  301,
			"message": "Card amount is less than transaction amount",
		})
		return
	}

	// Создаем транзакцию
	transaction := models.Transaction{
		ControlPanelID: panelID.(uint),
		UserID:         card.UserID,
		CardID:         &card.ID,
		CardUID:        &card.UID,
		PayType:        strPtr("card"),
	}

	if err := h.db.Create(&transaction).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create transaction"})
		return
	}

	// Создаем записи программ
	for _, prog := range req.Programs {
		discount := prog.Amount * float64(prog.DiscountPerCent) / 100

		transactionProgram := models.TransactionProgram{
			TransactionID:   transaction.ID,
			ProgramID:       &prog.ID,
			Amount:          prog.Amount,
			Discount:        discount,
			DiscountPerCent: prog.DiscountPerCent,
		}

		h.db.Create(&transactionProgram)
	}

	// Списываем средства с карты
	card.Amount -= finalAmount
	card.Turnover += finalAmount
	h.db.Save(&card)

	// 🔥 WEBSOCKET EVENT - уведомляем все админки о новой транзакции
	event := ws.NewEvent(ws.EventTransactionCard, gin.H{
		"transaction_id": transaction.ID,
		"card_uid":       card.UID,
		"amount":         finalAmount,
		"panel_id":       panelID,
		"card_balance":   card.Amount,
	})
	h.hub.BroadcastEvent(event)

	c.JSON(http.StatusOK, gin.H{
		"message":      "Transaction created",
		"card_balance": card.Amount,
	})
}

// MakeTransactionByCash - POST /api/make/transaction/cash
// Провести транзакцию через наличные
func (h *TransactionHandler) MakeTransactionByCash(c *gin.Context) {
	var req struct {
		Programs []ProgramTransaction `json:"programs" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	panelID, exists := c.Get("panel_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "panel not authenticated"})
		return
	}

	// Создаем транзакцию
	transaction := models.Transaction{
		ControlPanelID: panelID.(uint),
		PayType:        strPtr("cash"),
	}

	if err := h.db.Create(&transaction).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create transaction"})
		return
	}

	// Создаем записи программ
	for _, prog := range req.Programs {
		transactionProgram := models.TransactionProgram{
			TransactionID:   transaction.ID,
			ProgramID:       &prog.ID,
			Amount:          prog.Amount,
			Discount:        0,
			DiscountPerCent: 0,
		}

		h.db.Create(&transactionProgram)
	}

	// 🔥 WEBSOCKET EVENT
	event := ws.NewEvent(ws.EventTransactionCash, gin.H{
		"transaction_id": transaction.ID,
		"panel_id":       panelID,
		"pay_type":       "cash",
	})
	h.hub.BroadcastEvent(event)

	c.JSON(http.StatusOK, gin.H{
		"message": "Transaction created",
	})
}

// MakeTransactionByPaypass - POST /api/make/transaction/paypass
// Провести транзакцию через PayPass
func (h *TransactionHandler) MakeTransactionByPaypass(c *gin.Context) {
	var req struct {
		Programs []ProgramTransaction `json:"programs" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	panelID, exists := c.Get("panel_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "panel not authenticated"})
		return
	}

	// Создаем транзакцию
	transaction := models.Transaction{
		ControlPanelID: panelID.(uint),
		PayType:        strPtr("paypass"),
	}

	if err := h.db.Create(&transaction).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create transaction"})
		return
	}

	// Создаем записи программ
	for _, prog := range req.Programs {
		transactionProgram := models.TransactionProgram{
			TransactionID:   transaction.ID,
			ProgramID:       &prog.ID,
			Amount:          prog.Amount,
			Discount:        0,
			DiscountPerCent: 0,
		}

		h.db.Create(&transactionProgram)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Transaction created",
	})
}

// SendCashHolderInfo - POST /api/send/info/cash_holder
// Отправить данные по купюроприемнику
func (h *TransactionHandler) SendCashHolderInfo(c *gin.Context) {
	var req struct {
		Cash []struct {
			Rating int `json:"rating"`
			Count  int `json:"count"`
		} `json:"cash" binding:"required"`
		Total int `json:"total" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	panelID, exists := c.Get("panel_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "panel not authenticated"})
		return
	}

	// Ищем купюроприемник для этой панели
	var cashHolder models.CashHolder
	if err := h.db.First(&cashHolder, "control_panel_id = ?", panelID).Error; err != nil {
		c.JSON(301, gin.H{
			"status":  301,
			"message": "Don't have a cash_holder",
		})
		return
	}

	// Обновляем данные купюроприемника
	cashHolder.Total = req.Total
	cashHolder.TotalHave = req.Total
	h.db.Save(&cashHolder)

	// Обновляем информацию о купюрах
	h.db.Where("cash_holder_id = ?", cashHolder.ID).Delete(&models.InfoCashHolder{})

	for _, cash := range req.Cash {
		info := models.InfoCashHolder{
			CashHolderID: cashHolder.ID,
			Rating:       cash.Rating,
			Count:        cash.Count,
		}
		h.db.Create(&info)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Info accepted server",
	})
}

func strPtr(s string) *string {
	return &s
}