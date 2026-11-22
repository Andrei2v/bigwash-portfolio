package database

import (
	"log"

	// Зверни увагу: якщо твій go.mod має іншу назву модуля,
	// можливо, цей шлях доведеться трохи підправити під твій проект
	"database/internal/database/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		return nil, err
	}

	// Перевірка підключення
	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	if err := sqlDB.Ping(); err != nil {
		return nil, err
	}

	// Налаштування пулу з'єднань
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)

	// ==========================================
	// АВТОМІГРАЦІЯ БАЗИ ДАНИХ
	// ==========================================
	// GORM автоматично звірить структуру в models.User і реальну таблицю в MySQL.
	// Якщо колонок Balance або Tags немає — він їх створить.
	if err := db.AutoMigrate(&models.User{}); err != nil {
		log.Printf("⚠️ Помилка автоміграції таблиці users: %v\n", err)
	}

	// Якщо в майбутньому захочеш автоматично оновлювати й інші таблиці,
	// можна додати їх сюди ж через кому:
	// db.AutoMigrate(&models.User{}, &models.Card{}, &models.Admin{})

	log.Println("✅ Database connected and migrated")
	return db, nil
}