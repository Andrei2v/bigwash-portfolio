package migrations

import (
	"database/internal/database/models"
	"gorm.io/gorm/clause"
	"log"

	"gorm.io/gorm"
)

func RunMigrations(db *gorm.DB) error {
	if err := ForceRunMigrations(db); err != nil {
		return err
	}
	roles := [][]string{{"owner", "Власник"}, {"admin", "Адмін"}, {"service", "Сервіс"}}
	for _, names := range roles {
		var count int64
		if err := db.Model(&models.Role{}).Where("name IN ?", names).Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&models.Role{Name: names[1]}).Error; err != nil {
				return err
			}
		}
	}
	return nil
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
