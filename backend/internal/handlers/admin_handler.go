package handlers

import (
	"net/http"
	"strconv"

	"database/internal/database/models"
	"database/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AdminHandler struct {
	db *gorm.DB
}

func NewAdminHandler(db *gorm.DB) *AdminHandler {
	return &AdminHandler{db: db}
}

// CreateAdminRequest - запрос на создание администратора
type CreateAdminRequest struct {
	Firstname      string  `json:"firstname" binding:"required"`
	Lastname       string  `json:"lastname" binding:"required"`
	Email          string  `json:"email" binding:"required,email"`
	Phone          string  `json:"phone" binding:"required"`
	Password       string  `json:"password" binding:"required,min=6"`
	RoleID         uint    `json:"role_id" binding:"required"` // Змінено на RoleID, щоб співпадало з Svelte
	SpecialCardUID *string `json:"special_card_uid"`
}

// UpdateAdminRequest - запрос на обновление администратора
type UpdateAdminRequest struct {
	Firstname      *string `json:"firstname"`
	Lastname       *string `json:"lastname"`
	Email          *string `json:"email"`
	Phone          *string `json:"phone"`
	Password       *string `json:"password"`
	RoleID         *uint   `json:"role_id"` // Змінено на RoleID
	SpecialCardUID *string `json:"special_card_uid"`
	IsActive       *bool   `json:"is_active"`
}

// List - получить всех администраторов
func (h *AdminHandler) List(c *gin.Context) {
	var admins []models.Admin

	if err := h.db.Preload("Role").Find(&admins).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch admins"})
		return
	}

	// Конвертируем в response
	responses := make([]models.AdminResponse, len(admins))
	for i, admin := range admins {
		responses[i] = admin.ToResponse()
	}

	c.JSON(http.StatusOK, responses)
}

// Get - получить одного администратора
func (h *AdminHandler) Get(c *gin.Context) {
	id := c.Param("id")

	var admin models.Admin
	if err := h.db.Preload("Role").First(&admin, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "admin not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch admin"})
		return
	}

	c.JSON(http.StatusOK, admin.ToResponse())
}

// Create - создать администратора
func (h *AdminHandler) Create(c *gin.Context) {
	var req CreateAdminRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Проверяем существует ли email
	var exists int64
	h.db.Model(&models.Admin{}).Where("email = ?", req.Email).Count(&exists)
	if exists > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email already exists"})
		return
	}

	// Проверяем существует ли телефон
	h.db.Model(&models.Admin{}).Where("phone = ?", req.Phone).Count(&exists)
	if exists > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "phone already exists"})
		return
	}

	// Получаем роль по ID вместо имени
	var role models.Role
	if err := h.db.First(&role, req.RoleID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role_id"})
		return
	}

	// Хешируем пароль
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	// Создаем администратора
	admin := models.Admin{
		Firstname:      req.Firstname,
		Lastname:       req.Lastname,
		Email:          req.Email,
		Phone:          req.Phone,
		Password:       hashedPassword,
		RoleID:         role.ID,
		SpecialCardUID: req.SpecialCardUID,
		IsActive:       true,
	}

	if err := h.db.Create(&admin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create admin"})
		return
	}

	// Загружаем роль для ответа
	h.db.Preload("Role").First(&admin, admin.ID)

	c.JSON(http.StatusCreated, admin.ToResponse())
}

// Update - обновить администратора
func (h *AdminHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var admin models.Admin
	if err := h.db.First(&admin, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "admin not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch admin"})
		return
	}

	var req UpdateAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Обновляем поля
	if req.Firstname != nil {
		admin.Firstname = *req.Firstname
	}
	if req.Lastname != nil {
		admin.Lastname = *req.Lastname
	}
	if req.Email != nil {
		// Проверяем уникальность email
		var exists int64
		h.db.Model(&models.Admin{}).Where("email = ? AND id != ?", *req.Email, admin.ID).Count(&exists)
		if exists > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "email already exists"})
			return
		}
		admin.Email = *req.Email
	}
	if req.Phone != nil {
		// Проверяем уникальность телефона
		var exists int64
		h.db.Model(&models.Admin{}).Where("phone = ? AND id != ?", *req.Phone, admin.ID).Count(&exists)
		if exists > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "phone already exists"})
			return
		}
		admin.Phone = *req.Phone
	}
	if req.Password != nil && *req.Password != "" {
		hashedPassword, err := utils.HashPassword(*req.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
			return
		}
		admin.Password = hashedPassword
	}
	if req.RoleID != nil {
		var role models.Role
		if err := h.db.First(&role, *req.RoleID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role_id"})
			return
		}
		admin.RoleID = role.ID
	}
	if req.SpecialCardUID != nil {
		admin.SpecialCardUID = req.SpecialCardUID
	}
	if req.IsActive != nil {
		admin.IsActive = *req.IsActive
	}

	if err := h.db.Save(&admin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update admin"})
		return
	}

	// Загружаем роль для ответа
	h.db.Preload("Role").First(&admin, admin.ID)

	c.JSON(http.StatusOK, admin.ToResponse())
}

// Delete - удалить администратора
func (h *AdminHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	// Преобразуем ID в число для проверки
	adminID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var admin models.Admin
	if err := h.db.First(&admin, adminID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "admin not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch admin"})
		return
	}

	// Проверяем, не последний ли это администратор
	var count int64
	h.db.Model(&models.Admin{}).Count(&count)
	if count <= 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot delete last admin"})
		return
	}

	if err := h.db.Delete(&admin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete admin"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "admin deleted successfully"})
}

// GetStats - получить статистику по администраторам
func (h *AdminHandler) GetStats(c *gin.Context) {
	var stats struct {
		Total   int64 `json:"total"`
		Admin   int64 `json:"admin"`
		Owner   int64 `json:"owner"`
		Service int64 `json:"service"`
		Active  int64 `json:"active"`
	}

	// Общее количество
	h.db.Model(&models.Admin{}).Count(&stats.Total)

	// Активные
	h.db.Model(&models.Admin{}).Where("is_active = ?", true).Count(&stats.Active)

	// По ролям (замінено назви на українські, відповідно до сидера)
	h.db.Model(&models.Admin{}).
		Joins("JOIN roles ON roles.id = admins.role_id").
		Where("roles.name = ?", "Адмін").
		Count(&stats.Admin)

	h.db.Model(&models.Admin{}).
		Joins("JOIN roles ON roles.id = admins.role_id").
		Where("roles.name = ?", "Власник").
		Count(&stats.Owner)

	h.db.Model(&models.Admin{}).
		Joins("JOIN roles ON roles.id = admins.role_id").
		Where("roles.name = ?", "Сервіс").
		Count(&stats.Service)

	c.JSON(http.StatusOK, stats)
}
