package migrations

import (
	"database/internal/database/models"
	"log"

	"gorm.io/gorm"
)

// RunMigrations запускает миграции только если таблиц нет
func RunMigrations(db *gorm.DB) error {
	// Проверяем существует ли хотя бы одна таблица
	if db.Migrator().HasTable(&models.Admin{}) {
		log.Println("✅ Tables already exist, skipping migrations")
		return nil
	}

	log.Println("⏳ Creating tables...")

	return db.AutoMigrate(
		// Базовые таблицы
		&models.PasswordReset{},
		&models.PersonalAccessToken{},
		&models.Tag{},
		&models.Role{},
		&models.ServiceProgram{},
		&models.Program{},
		&models.Job{},
		&models.FailedJob{},
		&models.Article{},
		&models.TelegramMessage{},
		&models.PromoTemplate{},
		&models.ServiceSetting{},
		&models.PaymentSystem{},
		&models.LimitReset{},

		// Зависимости 1 уровня
		&models.Admin{},
		&models.User{},
		&models.CarWash{},
		&models.DiscountUser{},
		&models.Promo{},

		// Зависимости 2 уровня
		&models.CardGroup{},
		&models.Card{},
		&models.Session{},
		&models.ControlPanel{},
		&models.AdminCard{},
		&models.Expense{},
		&models.SumDiscount{},
		&models.TimeDiscount{},
		&models.PayDiscount{},
		&models.ClientPayDiscount{},
		&models.NewClientDiscount{},
		&models.ListGroup{},
		&models.ListTag{},
		&models.CarWashAdmin{},
		&models.Incasation{},
		&models.AdminStatistic{},

		// Зависимости 3 уровня
		&models.CashHolder{},
		&models.Transaction{},
		&models.PanelProgram{},
		&models.PanelServiceProgram{},
		&models.Device{},
		&models.MaintenanceTimetable{},
		&models.AdminTransaction{},
		&models.TimeDiscountProgram{},
		&models.TimeDiscountDay{},
		&models.AdminCardProgram{},
		&models.Payment{},
		&models.Replenishment{},
		&models.PromoPanel{},
		&models.KassaPayment{},
		&models.CardsGroupLimitSpent{},

		// Зависимости 4 уровня
		&models.InfoCashHolder{},
		&models.TransactionProgram{},
		&models.PanelProgramRelay{},
		&models.PanelServiceProgramRelay{},
		&models.DeviceMaintenance{},
		&models.AdminTransactionProgram{},
		&models.KassaTransaction{},
	)
}

// ForceRunMigrations принудительно запускает миграции (для обновления структуры)
func ForceRunMigrations(db *gorm.DB) error {
	log.Println("⚠️ Force running migrations...")
	
	return db.AutoMigrate(
		&models.PasswordReset{},
		&models.PersonalAccessToken{},
		&models.Tag{},
		&models.Role{},
		&models.ServiceProgram{},
		&models.Program{},
		&models.Job{},
		&models.FailedJob{},
		&models.Article{},
		&models.TelegramMessage{},
		&models.PromoTemplate{},
		&models.ServiceSetting{},
		&models.PaymentSystem{},
		&models.LimitReset{},
		&models.Admin{},
		&models.User{},
		&models.CarWash{},
		&models.DiscountUser{},
		&models.Promo{},
		&models.CardGroup{},
		&models.Card{},
		&models.Session{},
		&models.ControlPanel{},
		&models.AdminCard{},
		&models.Expense{},
		&models.SumDiscount{},
		&models.TimeDiscount{},
		&models.PayDiscount{},
		&models.ClientPayDiscount{},
		&models.NewClientDiscount{},
		&models.ListGroup{},
		&models.ListTag{},
		&models.CarWashAdmin{},
		&models.Incasation{},
		&models.AdminStatistic{},
		&models.CashHolder{},
		&models.Transaction{},
		&models.PanelProgram{},
		&models.PanelServiceProgram{},
		&models.Device{},
		&models.MaintenanceTimetable{},
		&models.AdminTransaction{},
		&models.TimeDiscountProgram{},
		&models.TimeDiscountDay{},
		&models.AdminCardProgram{},
		&models.Payment{},
		&models.Replenishment{},
		&models.PromoPanel{},
		&models.KassaPayment{},
		&models.CardsGroupLimitSpent{},
		&models.InfoCashHolder{},
		&models.TransactionProgram{},
		&models.PanelProgramRelay{},
		&models.PanelServiceProgramRelay{},
		&models.DeviceMaintenance{},
		&models.AdminTransactionProgram{},
		&models.KassaTransaction{},
		&models.DailyStats{},
		&models.MonthlyStats{},
		&models.PaymentMethodStats{},
		&models.ClientStats{},
		&models.TransactionStats{},
		&models.Activity{},
	)
}