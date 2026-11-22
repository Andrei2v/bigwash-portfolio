package handlers

import (
	"net/http"

	"database/internal/database/models"
	"database/internal/ws"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ProgramHandler struct {
	db  *gorm.DB
	hub *ws.Hub
}

func NewProgramHandler(db *gorm.DB, hub *ws.Hub) *ProgramHandler {
	return &ProgramHandler{db: db, hub: hub}
}

// List - получить все программы
func (h *ProgramHandler) List(c *gin.Context) {
	var programs []models.Program

	if err := h.db.Find(&programs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch programs"})
		return
	}

	c.JSON(http.StatusOK, programs)
}

// Get - получить одну программу
func (h *ProgramHandler) Get(c *gin.Context) {
	id := c.Param("id")

	var program models.Program
	if err := h.db.First(&program, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "program not found"})
		return
	}

	c.JSON(http.StatusOK, program)
}

// Create - создать программу
func (h *ProgramHandler) Create(c *gin.Context) {
	var program models.Program

	if err := c.ShouldBindJSON(&program); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if program.PriceType == "" {
		program.PriceType = "minute"
	}

	if err := h.db.Create(&program).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	event := ws.NewEvent(ws.EventProgramCreated, program)
	h.hub.BroadcastEvent(event)

	c.JSON(http.StatusCreated, program)
}


// Update - обновить программу
func (h *ProgramHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var program models.Program
	if err := h.db.First(&program, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "program not found"})
		return
	}

	if err := c.ShouldBindJSON(&program); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.Save(&program).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update program"})
		return
	}

	// 🔥 WEBSOCKET EVENT
	event := ws.NewEvent(ws.EventProgramUpdated, program)
	h.hub.BroadcastEvent(event)

	c.JSON(http.StatusOK, program)
}

// Delete - удалить программу
func (h *ProgramHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	// Проверяем можно ли удалить
	var program models.Program
	if err := h.db.First(&program, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "program not found"})
		return
	}

	if !program.CanDelete {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot delete this program"})
		return
	}

	if err := h.db.Delete(&models.Program{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete program"})
		return
	}

	// 🔥 WEBSOCKET EVENT
	event := ws.NewEvent(ws.EventProgramDeleted, gin.H{"id": id})
	h.hub.BroadcastEvent(event)

	c.JSON(http.StatusOK, gin.H{"message": "program deleted"})
}

// ListForPanel - GET /api/list/programs
// Получить список программ для пульта
func (h *ProgramHandler) ListForPanel(c *gin.Context) {
	panelID, _ := c.Get("panel_id")

	// Получаем программы пульта с настройками
	var panelPrograms []models.PanelProgram
	if err := h.db.Preload("Program").
		Where("control_panel_id = ?", panelID).
		Order("button").
		Find(&panelPrograms).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch programs"})
		return
	}

	// Формируем ответ
	programs := []gin.H{}
	for _, pp := range panelPrograms {
		if pp.ProgramID == 0 {
			continue
		}

		// Получаем реле для этой программы
		var relays []models.PanelProgramRelay
		h.db.Where("panel_program_id = ?", pp.ID).Find(&relays)

		relayNumbers := []int{}
		timeoutsOn := []int{}
		timeoutsOff := []int{}

		for _, relay := range relays {
			relayNumbers = append(relayNumbers, relay.RelayNumber)
			timeoutsOn = append(timeoutsOn, relay.TimeoutOn)
			timeoutsOff = append(timeoutsOff, relay.TimeoutOff)
		}

		programs = append(programs, gin.H{
			"program_id":    pp.Program.ID,
			"name":          pp.Program.Name,
			"priceType":     pp.Program.PriceType,
			"numberBtn":     pp.Button,
			"numberRelay":   relayNumbers,
			"amount":        pp.Program.Price,
			"bypass":        pp.Bypass,
			"timeout_money": pp.TimeoutMoney,
			"discounts":     []interface{}{},
			"timeout_on":    timeoutsOn,
			"timeout_off":   timeoutsOff,
			"available":     pp.Available,
		})
	}

	// Получаем сервисные программы
	var servicePanelPrograms []models.PanelServiceProgram
	h.db.Preload("ServiceProgram").
		Where("control_panel_id = ?", panelID).
		Find(&servicePanelPrograms)

	servicePrograms := []gin.H{}
	for _, spp := range servicePanelPrograms {
		if spp.ServiceProgramID == 0 {
			continue
		}

		// Получаем реле для сервисной программы
		var relays []models.PanelServiceProgramRelay
		h.db.Where("panel_service_program_id = ?", spp.ID).Find(&relays)

		relayNumbers := []int{}
		for _, relay := range relays {
			relayNumbers = append(relayNumbers, relay.RelayNumber)
		}

		servicePrograms = append(servicePrograms, gin.H{
			"program_id":   spp.ServiceProgram.ID,
			"name":         spp.ServiceProgram.Name,
			"numberBtn":    spp.Button,
			"numbersRelay": relayNumbers,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"programs":         programs,
		"service_programs": servicePrograms,
	})
}

// ListDiscounts - GET /api/list/discounts
// Получить список скидок для пульта
func (h *ProgramHandler) ListDiscounts(c *gin.Context) {
	// TODO: реализовать получение скидок
	// Пока возвращаем пустые массивы

	c.JSON(http.StatusOK, gin.H{
		"time_discounts": []gin.H{},
		"pay_discounts": gin.H{
			"paypass": gin.H{
				"discount": 0,
				"users": gin.H{
					"is_all": true,
					"groups": []int{},
					"tags":   []int{},
				},
			},
			"cash": gin.H{
				"discount": 0,
				"users": gin.H{
					"is_all": true,
					"groups": []int{},
					"tags":   []int{},
				},
			},
		},
		"client_pay_discounts": gin.H{
			"paypass": gin.H{
				"discount": 0,
				"users": gin.H{
					"is_all": true,
					"groups": []int{},
					"tags":   []int{},
				},
			},
			"cash": gin.H{
				"discount": 0,
				"users": gin.H{
					"is_all": true,
					"groups": []int{},
					"tags":   []int{},
				},
			},
		},
		"sum_discounts":                  []gin.H{},
		"total_replenishment_discounts": []gin.H{},
		"new_client_discounts": gin.H{
			"money": gin.H{
				"discount": 0,
				"users": gin.H{
					"is_all": true,
					"groups": []int{},
					"tags":   []int{},
				},
			},
			"pay_per_cent": gin.H{
				"discount": 0,
				"users": gin.H{
					"is_all": true,
					"groups": []int{},
					"tags":   []int{},
				},
			},
		},
	})
}