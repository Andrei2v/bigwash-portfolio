package handlers

import (
	"errors"
	"net/http"
	"strings"

	"database/internal/database/models"
	"database/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AuthHandler struct {
	db        *gorm.DB
	jwtSecret string
}

func NewAuthHandler(db *gorm.DB, jwtSecret string) *AuthHandler {
	return &AuthHandler{
		db:        db,
		jwtSecret: jwtSecret,
	}
}

// Register - регистрация администратора
func (h *AuthHandler) Register(c *gin.Context) {
	var req struct {
		Email     string `json:"email" binding:"required,email"`
		Password  string `json:"password" binding:"required,min=6"`
		Firstname string `json:"firstname" binding:"required"`
		Lastname  string `json:"lastname" binding:"required"`
		Phone     string `json:"phone" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))

	var exists int64
	if err := h.db.Model(&models.Admin{}).
		Where("LOWER(email) = ?", email).
		Count(&exists).Error; err != nil {

		_ = c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "database error",
		})
		return
	}

	if exists > 0 {
		c.JSON(http.StatusConflict, gin.H{
			"error": "email already exists",
		})
		return
	}

	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to hash password",
		})
		return
	}

	var role models.Role
	if err := h.db.Where("name = ?", "admin").
		First(&role).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "admin role not found",
		})
		return
	}

	admin := models.Admin{
		Firstname: req.Firstname,
		Lastname:  req.Lastname,
		Email:     email,
		Phone:     req.Phone,
		Password:  hash,
		RoleID:    role.ID,
	}

	if err := h.db.Create(&admin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to create user",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "user registered successfully",
		"user": gin.H{
			"id":        admin.ID,
			"email":     admin.Email,
			"firstname": admin.Firstname,
			"lastname":  admin.Lastname,
		},
	})
}

// Login - авторизация администратора
func (h *AuthHandler) Login(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))

	var admin models.Admin
	err := h.db.Preload("Role").
		Where("LOWER(email) = ?", email).
		First(&admin).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "invalid credentials",
			})
		} else {
			_ = c.Error(err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "database error",
			})
		}
		return
	}

	if !utils.CheckPassword(req.Password, admin.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "invalid credentials",
		})
		return
	}

	if admin.Role.Name == "" {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "admin role is missing",
		})
		return
	}

	token, err := utils.GenerateToken(
		admin.ID,
		admin.Role.Name,
		h.jwtSecret,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to generate token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":        admin.ID,
			"email":     admin.Email,
			"firstname": admin.Firstname,
			"lastname":  admin.Lastname,
			"role":      admin.Role.Name,
		},
	})
}

// PanelLogin - авторизация панели автомойки
func (h *AuthHandler) PanelLogin(c *gin.Context) {
	var req struct {
		Login    string `json:"login" binding:"required"`
		Password string `json:"password" binding:"required"`
		Link     string `json:"link"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	var panel models.ControlPanel

	err := h.db.Preload("CarWash").
		Where("login = ?", req.Login).
		First(&panel).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusForbidden, gin.H{
				"status":  403,
				"message": "Login or password invalid",
			})
		} else {
			_ = c.Error(err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "database error",
			})
		}
		return
	}

	// Сохраняем существующую проверку пароля панели.
	// Позже нужно перевести её на bcrypt.
	if panel.Password != req.Password {
		c.JSON(http.StatusForbidden, gin.H{
			"status":  403,
			"message": "Login or password invalid",
		})
		return
	}

	if req.Link != "" {
		panel.Link = &req.Link

		if err := h.db.Save(&panel).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to update panel",
			})
			return
		}
	}

	token, err := utils.GeneratePanelToken(
		panel.ID,
		panel.CarWashID,
		h.jwtSecret,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to generate token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
	})
}
