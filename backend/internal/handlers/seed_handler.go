package handlers

import (
	secureRand "crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"net/http"
	"time"

	"database/internal/database/models"
	"database/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SeedHandler struct {
	db *gorm.DB
}

func NewSeedHandler(db *gorm.DB) *SeedHandler {
	return &SeedHandler{db: db}
}

// Структура для тегів клієнтів
type Tag struct {
	Name  string `json:"name"`
	Color string `json:"color"`
}

// SeedData inserts test data in one transaction.
func (h *SeedHandler) SeedData(c *gin.Context) {
	var message string
	err := h.db.WithContext(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		var err error
		message, err = seedData(tx)
		return err
	})
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "seed failed; no records were added"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok", "message": message})
}

func seedData(db *gorm.DB) (string, error) {
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	firstNames := []string{"Олександр", "Дмитро", "Єгор", "Іван", "Максим", "Андрій", "Артем", "Ярослав"}
	lastNames := []string{"Коваленко", "Бойко", "Шевченко", "Голованець", "Ткаченко", "Кравченко"}

	// ========================================================
	// ЕТАП 1: РОЛІ ТА АДМІНІСТРАТОРИ
	// ========================================================
	var adminRole, serviceRole models.Role
	if err := db.Where("name IN ?", []string{"admin", "Адмін"}).First(&adminRole).Error; err != nil {
		return "", err
	}
	if err := db.Where("name IN ?", []string{"service", "Сервіс"}).First(&serviceRole).Error; err != nil {
		return "", err
	}
	var secret [32]byte
	if _, err := secureRand.Read(secret[:]); err != nil {
		return "", err
	}
	hashedPassword, err := utils.HashPassword(hex.EncodeToString(secret[:]))
	if err != nil {
		return "", err
	}
	var createdAdmins int
	for i := 1; i <= 20; i++ {
		roleID := adminRole.ID
		if rng.Float32() > 0.5 {
			roleID = serviceRole.ID
		} else if rng.Float32() > 0.5 {
			roleID = 3 // Інші випадково стають Сервісом
		}

		cardUID := fmt.Sprintf("%d %d %d %d", rng.Intn(900)+100, rng.Intn(900)+100, rng.Intn(900)+100, rng.Intn(9000)+1000)

		admin := models.Admin{
			Firstname: firstNames[rng.Intn(len(firstNames))],
			Lastname:  lastNames[rng.Intn(len(lastNames))],
			Email:     fmt.Sprintf("admin_%d@bigwash.test", i),
			Phone:     fmt.Sprintf("09%d %03d %02d %02d", rng.Intn(9)+1, rng.Intn(1000), rng.Intn(100), rng.Intn(100)),
			Password:  hashedPassword,
			RoleID:    uint(roleID),
			IsActive:  true,
		}

		// 80% шанс отримати спецкарту
		if rng.Float32() > 0.2 {
			admin.SpecialCardUID = &cardUID
		}

		if err := db.Create(&admin).Error; err != nil {
			return "", err
		}
		createdAdmins++
	}

	// ========================================================
	// ЕТАП 2: КЛІЄНТИ ТА КАРТКИ
	// ========================================================
	tagsPool := []Tag{
		{Name: "Мото", Color: "#EF3636"},
		{Name: "Авто", Color: "#A855F7"},
		{Name: "Фури", Color: "#F59E0B"},
		{Name: "Таксі", Color: "#EAB308"},
	}

	var createdUsers int
	var createdCards int

	// ЦИКЛ 1: 20 Клієнтів РАЗОМ із картками
	for i := 1; i <= 20; i++ {
		fName := firstNames[rng.Intn(len(firstNames))]
		lName := lastNames[rng.Intn(len(lastNames))]

		numTags := rng.Intn(2) + 1
		var clientTags []Tag
		for j := 0; j < numTags; j++ {
			clientTags = append(clientTags, tagsPool[rng.Intn(len(tagsPool))])
		}
		tagsBytes, _ := json.Marshal(clientTags)

		userMoney := math.Round((50+rng.Float64()*4450)*100) / 100

		user := models.User{
			Firstname: fName,
			Lastname:  lName,
			Email:     fmt.Sprintf("client_card_%d_%d@bigwash.test", i, time.Now().Unix()),
			Phone:     fmt.Sprintf("09%d %03d %02d %02d", rng.Intn(9)+1, rng.Intn(1000), rng.Intn(100), rng.Intn(100)),
			Password:  hashedPassword,
			Tags:      string(tagsBytes),
			Balance:   userMoney,
		}

		if err := db.Create(&user).Error; err != nil {
			return "", err
		}
		createdUsers++

		randomBalance := math.Round((50+rng.Float64()*4450)*100) / 100
		card := models.Card{
			UID:      fmt.Sprintf("CARD-%06d", rng.Intn(899999)+100000),
			Type:     "default",
			Amount:   randomBalance,
			UserID:   &user.ID,
			Discount: rng.Intn(15),
		}

		if err := db.Create(&card).Error; err != nil {
			return "", err
		}
		createdCards++
	}

	// ЦИКЛ 2: Ще 20 Клієнтів БЕЗ карток
	for i := 21; i <= 40; i++ {
		fName := firstNames[rng.Intn(len(firstNames))]
		lName := lastNames[rng.Intn(len(lastNames))]

		numTags := rng.Intn(3)
		var clientTags []Tag
		for j := 0; j < numTags; j++ {
			clientTags = append(clientTags, tagsPool[rng.Intn(len(tagsPool))])
		}
		tagsBytes, _ := json.Marshal(clientTags)

		userMoney := math.Round((10+rng.Float64()*1500)*100) / 100

		user := models.User{
			Firstname: fName,
			Lastname:  lName,
			Email:     fmt.Sprintf("client_nocard_%d_%d@bigwash.test", i, time.Now().Unix()),
			Phone:     fmt.Sprintf("09%d %03d %02d %02d", rng.Intn(9)+1, rng.Intn(1000), rng.Intn(100), rng.Intn(100)),
			Password:  hashedPassword,
			Tags:      string(tagsBytes),
			Balance:   userMoney,
		}

		if err := db.Create(&user).Error; err != nil {
			return "", err
		}
		createdUsers++
	}

	return fmt.Sprintf("Створено %d адміністраторів, %d клієнтів і %d карток.", createdAdmins, createdUsers, createdCards), nil
}
