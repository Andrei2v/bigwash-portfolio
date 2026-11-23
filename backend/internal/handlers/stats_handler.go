package handlers

import (
	"database/internal/database/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type StatsHandler struct {
	DB *gorm.DB
}

func NewStatsHandler(db *gorm.DB) *StatsHandler {
	return &StatsHandler{DB: db}
}

// GetDashboardStats - отримати всю статистику для дашборду
// GET /api/v1/stats/dashboard
func (h *StatsHandler) GetDashboardStats(c *gin.Context) {
	now := time.Now()
	today := now.Format("2006-01-02")
	db := h.DB.WithContext(c.Request.Context())
	var dailyStats models.DailyStats
	var clientStats models.ClientStats
	paymentStats := []models.PaymentMethodStats{}
	transactionStats := []models.TransactionStats{}
	activities := []models.Activity{}
	for _, target := range []any{&dailyStats, &clientStats} {
		err := db.Where("date = ?", today).First(target).Error
		if err != nil && err != gorm.ErrRecordNotFound {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database operation failed"})
			return
		}
	}
	for _, target := range []any{&paymentStats, &transactionStats} {
		if err := db.Where("date = ?", today).Find(target).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database operation failed"})
			return
		}
	}
	if err := db.Order("time desc").Limit(5).Find(&activities).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database operation failed"})
		return
	}

	if dailyStats.Date.IsZero() {
		dailyStats.Date = now
	}
	if clientStats.Date.IsZero() {
		clientStats.Date = now
	}
	c.JSON(http.StatusOK, gin.H{
		"daily_stats":       dailyStats,
		"payment_methods":   paymentStats,
		"client_stats":      clientStats,
		"transaction_stats": transactionStats,
		"activities":        activities,
	})
}

// GetMonthlyChart - отримати дані для графіку по місяцях
// GET /api/v1/stats/monthly-chart
func (h *StatsHandler) GetMonthlyChart(c *gin.Context) {
	year := time.Now().Year()

	monthlyStats := []models.MonthlyStats{}
	if err := h.DB.WithContext(c.Request.Context()).Where("year = ?", year).Order("month").Find(&monthlyStats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database operation failed"})
		return
	}

	c.JSON(http.StatusOK, monthlyStats)
}

// GetPaymentMethods - отримати статистику методів оплати за період
// GET /api/v1/stats/payment-methods?period=month
func (h *StatsHandler) GetPaymentMethods(c *gin.Context) {
	period := c.DefaultQuery("period", "month")

	var startDate time.Time
	now := time.Now()

	switch period {
	case "today":
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	case "week":
		startDate = now.AddDate(0, 0, -7)
	case "month":
		startDate = now.AddDate(0, -1, 0)
	case "year":
		startDate = now.AddDate(-1, 0, 0)
	default:
		startDate = now.AddDate(0, -1, 0)
	}

	var stats []models.PaymentMethodStats
	h.DB.Where("date >= ?", startDate).Find(&stats)

	// Агрегуємо дані по методах
	type AggregatedStat struct {
		Method string  `json:"method"`
		Count  int     `json:"count"`
		Amount float64 `json:"amount"`
	}

	aggregated := make(map[string]*AggregatedStat)

	for _, stat := range stats {
		if existing, ok := aggregated[stat.Method]; ok {
			existing.Count += stat.Count
			existing.Amount += stat.Amount
		} else {
			aggregated[stat.Method] = &AggregatedStat{
				Method: stat.Method,
				Count:  stat.Count,
				Amount: stat.Amount,
			}
		}
	}

	result := make([]AggregatedStat, 0, len(aggregated))
	for _, v := range aggregated {
		result = append(result, *v)
	}

	c.JSON(http.StatusOK, result)
}

// AddActivity - додати запис активності
// POST /api/v1/stats/activities
func (h *StatsHandler) AddActivity(c *gin.Context) {
	var activity models.Activity
	if err := c.ShouldBindJSON(&activity); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	activity.Time = time.Now()
	if err := h.DB.Create(&activity).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database operation failed"})
		return
	}

	c.JSON(http.StatusOK, activity)
}

// GetActivities - отримати останню активність
// GET /api/v1/stats/activities?limit=10
func (h *StatsHandler) GetActivities(c *gin.Context) {
	limit := 10
	if limitParam := c.Query("limit"); limitParam != "" {
		// можна додати парсинг
	}

	var activities []models.Activity
	h.DB.Order("time desc").Limit(limit).Find(&activities)

	c.JSON(http.StatusOK, activities)
}

// UpdateDailyStats - оновити щоденну статистику
// PUT /api/v1/stats/daily
func (h *StatsHandler) UpdateDailyStats(c *gin.Context) {
	var stats models.DailyStats
	if err := c.ShouldBindJSON(&stats); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	today := time.Now().Format("2006-01-02")

	// Шукаємо існуючий запис
	var existing models.DailyStats
	if err := h.DB.Where("date = ?", today).First(&existing).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Створюємо новий
			stats.Date = time.Now()
			if err := h.DB.Create(&stats).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "database operation failed"})
				return
			}
			c.JSON(http.StatusOK, stats)
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database operation failed"})
		return
	}

	// Оновлюємо існуючий
	existing.Profit = stats.Profit
	existing.Expenses = stats.Expenses
	existing.Balance = stats.Balance

	if err := h.DB.Save(&existing).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database operation failed"})
		return
	}

	c.JSON(http.StatusOK, existing)
}

// DeleteAllStats - видалити всю статистику
// DELETE /api/v1/stats/all
func (h *StatsHandler) DeleteAllStats(c *gin.Context) {
	// Видаляємо всі дані зі статистики
	tables := []interface{}{
		&models.DailyStats{},
		&models.MonthlyStats{},
		&models.PaymentMethodStats{},
		&models.ClientStats{},
		&models.TransactionStats{},
		&models.Activity{},
	}

	for _, table := range tables {
		if err := h.DB.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(table).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database operation failed"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "All statistics deleted successfully"})
}
