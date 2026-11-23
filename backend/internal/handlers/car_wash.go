package handlers

import (
	"net/http"

	"database/internal/database/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CarWashHandler struct {
	db *gorm.DB
}

func NewCarWashHandler(db *gorm.DB) *CarWashHandler {
	return &CarWashHandler{db: db}
}

// List - получить все автомойки
func (h *CarWashHandler) List(c *gin.Context) {
	var carWashes []models.CarWash

	if err := h.db.Find(&carWashes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch car washes"})
		return
	}

	c.JSON(http.StatusOK, carWashes)
}

// Get - получить одну автомойку
func (h *CarWashHandler) Get(c *gin.Context) {
	id := c.Param("id")

	var carWash models.CarWash
	if err := h.db.First(&carWash, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "car wash not found"})
		return
	}

	c.JSON(http.StatusOK, carWash)
}

// Create - создать автомойку
func (h *CarWashHandler) Create(c *gin.Context) {
	var carWash models.CarWash

	if err := c.ShouldBindJSON(&carWash); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.Create(&carWash).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create car wash"})
		return
	}

	c.JSON(http.StatusCreated, carWash)
}

// Update - обновить автомойку
func (h *CarWashHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var carWash models.CarWash
	if err := h.db.First(&carWash, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "car wash not found"})
		return
	}

	if err := c.ShouldBindJSON(&carWash); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.Save(&carWash).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update car wash"})
		return
	}

	c.JSON(http.StatusOK, carWash)
}

// Delete - удалить автомойку
func (h *CarWashHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	if err := h.db.Delete(&models.CarWash{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete car wash"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "car wash deleted"})
}

// GetInfo - GET /api/car-wash/info
func (h *CarWashHandler) GetInfo(c *gin.Context) {
	carWashID, _ := c.Get("car_wash_id")

	var carWash models.CarWash
	if err := h.db.First(&carWash, carWashID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "car wash not found"})
		return
	}

	response := gin.H{
		"car_wash": gin.H{
			"id":                          carWash.ID,
			"uid":                         carWash.UID,
			"name":                        carWash.Name,
			"address":                     carWash.Address,
			"fisk_skip":                   carWash.FiskSkip,
			"theme":                       carWash.Theme,
			"theme_auto_switch":           carWash.ThemeAutoSwitch,
			"dark_theme_activation_time":  getStrPtr(carWash.DarkThemeActivationTime),
			"light_theme_activation_time": getStrPtr(carWash.LightThemeActivationTime),
			"isDeWash":                    carWash.IsDeWash == "да",
		},
	}

	c.JSON(http.StatusOK, response)
}

func getStrPtr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
