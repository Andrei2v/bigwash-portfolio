package handlers

import (
	"errors"
	"math"
	"net/http"

	"database/internal/database/models"
	"database/internal/ws"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type TransactionHandler struct {
	db  *gorm.DB
	hub *ws.Hub
}

func NewTransactionHandler(db *gorm.DB, hub *ws.Hub) *TransactionHandler {
	return &TransactionHandler{db: db, hub: hub}
}

type ProgramTransaction struct {
	ID              uint    `json:"id" binding:"required"`
	Amount          float64 `json:"amount" binding:"gt=0,lte=99999999.99"`
	DiscountPerCent int     `json:"discount_per_cent" binding:"gte=0,lte=100"`
}

// MakeTransactionByCard - POST /api/make/transaction/card
// Провести транзакцию через карту клиента
func (h *TransactionHandler) MakeTransactionByCard(c *gin.Context) {
	var req struct {
		CardUID  string               `json:"card_uid" binding:"required"`
		Programs []ProgramTransaction `json:"programs" binding:"required,min=1,max=100,dive"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	panelID := c.GetUint("panel_id")
	var card models.Card
	var transaction models.Transaction
	var amount float64
	blocked := errors.New("card is blocked")
	insufficient := errors.New("insufficient card balance")
	err := h.db.WithContext(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&card, "uid = ?", req.CardUID).Error; err != nil {
			return err
		}
		if card.IsBlocked {
			return blocked
		}
		for _, prog := range req.Programs {
			amount += math.Round(prog.Amount*100) - math.Round(prog.Amount*float64(prog.DiscountPerCent))
		}
		amount /= 100
		if card.Amount < amount {
			return insufficient
		}
		transaction = models.Transaction{ControlPanelID: panelID, UserID: card.UserID, CardID: &card.ID, CardUID: &card.UID, PayType: strPtr("card")}
		if err := insertTransaction(tx, &transaction, req.Programs, true); err != nil {
			return err
		}
		card.Amount -= amount
		card.Turnover += amount
		return tx.Model(&card).Select("amount", "turnover").Updates(&card).Error
	})
	switch {
	case errors.Is(err, gorm.ErrRecordNotFound):
		c.JSON(http.StatusNotFound, gin.H{"status": 404, "message": "Card not found"})
		return
	case errors.Is(err, blocked):
		c.JSON(http.StatusForbidden, gin.H{"status": 403, "message": "Card is blocked"})
		return
	case errors.Is(err, insufficient):
		c.JSON(http.StatusConflict, gin.H{"status": 409, "message": "Card amount is less than transaction amount"})
		return
	case err != nil:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create transaction"})
		return
	}

	// 🔥 WEBSOCKET EVENT - уведомляем все админки о новой транзакции
	event := ws.NewEvent(ws.EventTransactionCard, gin.H{
		"transaction_id": transaction.ID,
		"card_uid":       card.UID,
		"amount":         amount,
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
		Programs []ProgramTransaction `json:"programs" binding:"required,min=1,max=100,dive"`
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

	if err := h.db.WithContext(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		return insertTransaction(tx, &transaction, req.Programs, false)
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create transaction"})
		return
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
		Programs []ProgramTransaction `json:"programs" binding:"required,min=1,max=100,dive"`
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

	if err := h.db.WithContext(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		return insertTransaction(tx, &transaction, req.Programs, false)
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create transaction"})
		return
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
func insertTransaction(tx *gorm.DB, transaction *models.Transaction, programs []ProgramTransaction, applyDiscount bool) error {
	if err := tx.Create(transaction).Error; err != nil {
		return err
	}
	items := make([]models.TransactionProgram, 0, len(programs))
	for _, program := range programs {
		item := models.TransactionProgram{TransactionID: transaction.ID, ProgramID: &program.ID, Amount: math.Round(program.Amount*100) / 100}
		if applyDiscount {
			item.DiscountPerCent = program.DiscountPerCent
			item.Discount = math.Round(program.Amount*float64(program.DiscountPerCent)) / 100
		}
		items = append(items, item)
	}
	return tx.Create(&items).Error
}
