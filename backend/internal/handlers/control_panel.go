package handlers

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"time"

	"database/internal/database/models"
	"database/internal/ws"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ControlPanelHandler struct {
	db  *gorm.DB
	hub *ws.Hub
}

func NewControlPanelHandler(db *gorm.DB, hub *ws.Hub) *ControlPanelHandler {
	return &ControlPanelHandler{db: db, hub: hub}
}

// List - получить все пульты
func (h *ControlPanelHandler) List(c *gin.Context) {
	var panels []models.ControlPanel

	if err := h.db.Preload("CarWash").Find(&panels).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch panels"})
		return
	}

	c.JSON(http.StatusOK, panels)
}

// Get - получить один пульт
func (h *ControlPanelHandler) Get(c *gin.Context) {
	id := c.Param("id")

	var panel models.ControlPanel
	if err := h.db.Preload("CarWash").First(&panel, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "panel not found"})
		return
	}

	c.JSON(http.StatusOK, panel)
}

// Create - создать пульт
func (h *ControlPanelHandler) Create(c *gin.Context) {
	var req struct {
		models.ControlPanel
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	panel := req.ControlPanel
	panel.Password = req.Password

	// ✅ DEFAULTS
	if panel.TypePanel == "" {
		panel.TypePanel = "panel_v2"
	}
	if panel.Status == "" {
		panel.Status = "inactive"
	}
	if panel.AutoZReportTime == "" {
		panel.AutoZReportTime = "23:40:00"
	}
	if panel.DayMessage == "" {
		panel.DayMessage = "Усім доброго дня"
	}

	if err := h.db.Create(&panel).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create panel"})
		return
	}

	h.hub.Broadcast <- ws.Message{
		Type: "panel_created",
		Data: panel,
	}

	c.JSON(http.StatusCreated, panel)
}

// Update - обновить пульт
func (h *ControlPanelHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var panel models.ControlPanel
	if err := h.db.First(&panel, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "panel not found"})
		return
	}

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.Model(&panel).Updates(req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update panel"})
		return
	}

	c.JSON(http.StatusOK, panel)
}

// Delete - удалить пульт
func (h *ControlPanelHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	if err := h.db.Delete(&models.ControlPanel{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete panel"})
		return
	}

	h.hub.Broadcast <- ws.Message{
		Type: "panel_deleted",
		Data: gin.H{"id": id},
	}

	c.JSON(http.StatusOK, gin.H{"message": "panel deleted"})
}

// Copy - копировать настройки пульта
func (h *ControlPanelHandler) Copy(c *gin.Context) {
	sourceID := c.Param("id")

	var req struct {
		TargetID uint `json:"target_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var source models.ControlPanel
	if err := h.db.First(&source, sourceID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "source panel not found"})
		return
	}

	var target models.ControlPanel
	if err := h.db.First(&target, req.TargetID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "target panel not found"})
		return
	}

	target.TypePanel = source.TypePanel
	target.DayMessage = source.DayMessage
	target.DayMessageActive = source.DayMessageActive
	target.DayMessageX = source.DayMessageX
	target.DayMessageY = source.DayMessageY
	target.ReadWriteMode = source.ReadWriteMode
	target.CardholderReadMode = source.CardholderReadMode
	target.MaxDurationPause = source.MaxDurationPause
	target.MaxCountPause = source.MaxCountPause
	target.TimeStartMoney = source.TimeStartMoney
	target.TimeOffLight = source.TimeOffLight
	target.UsbPortCash = source.UsbPortCash
	target.UsbPortPaypass = source.UsbPortPaypass
	target.ButtonBoardPort = source.ButtonBoardPort
	target.BarCodePort = source.BarCodePort

	if err := h.db.Save(&target).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to copy settings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "settings copied successfully"})
}

// Reboot - перезагрузить пульт
func (h *ControlPanelHandler) Reboot(c *gin.Context) {
	id := c.Param("id")

	var panel models.ControlPanel
	if err := h.db.First(&panel, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "panel not found"})
		return
	}

	panel.Status = "reboot"
	h.db.Save(&panel)

	h.hub.Broadcast <- ws.Message{
		Type: "panel_status_updated",
		Data: gin.H{
			"panel_id": panel.ID,
			"status":   "reboot",
		},
	}

	c.JSON(http.StatusOK, gin.H{"message": "reboot command sent"})
}

// GeneratePassword - сгенерировать случайный пароль
func (h *ControlPanelHandler) GeneratePassword(c *gin.Context) {
	b := make([]byte, 16)
	rand.Read(b)
	password := base64.URLEncoding.EncodeToString(b)[:12]

	c.JSON(http.StatusOK, gin.H{"password": password})
}

// InitPanel - GET /api/panel/init
func (h *ControlPanelHandler) InitPanel(c *gin.Context) {
	panelID, _ := c.Get("panel_id")

	var panel models.ControlPanel
	if err := h.db.Preload("CarWash").First(&panel, panelID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "panel not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"panel": gin.H{
			"id":          panel.ID,
			"name":        panel.Name,
			"type_panel":  panel.TypePanel,
			"day_message": panel.DayMessage,
		},
		"car_wash": gin.H{
			"id":      panel.CarWash.ID,
			"name":    panel.CarWash.Name,
			"address": panel.CarWash.Address,
		},
	})
}

// ChangeMode - POST /api/panel/change/mode
func (h *ControlPanelHandler) ChangeMode(c *gin.Context) {
	panelID, _ := c.Get("panel_id")

	var req struct {
		ModeName string `json:"mode_name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var panel models.ControlPanel
	if err := h.db.First(&panel, panelID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "panel not found"})
		return
	}

	panel.ActiveMode = &req.ModeName
	h.db.Save(&panel)

	c.JSON(http.StatusOK, gin.H{"message": "Panel mode changed"})
}

// Ping - GET /api/panel/ping
func (h *ControlPanelHandler) Ping(c *gin.Context) {
	panelID, _ := c.Get("panel_id")

	var panel models.ControlPanel
	if err := h.db.First(&panel, panelID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "panel not found"})
		return
	}

	now := time.Now()
	panel.LastPingAt = &now
	panel.Status = "active"
	h.db.Save(&panel)

	c.JSON(http.StatusOK, gin.H{"message": "pong"})
}

// GetServerDate - GET /api/get/server/date
func (h *ControlPanelHandler) GetServerDate(c *gin.Context) {
	now := time.Now().Format("2006.01.02 15:04:05")
	c.JSON(http.StatusOK, now)
}
