package main

import (
	"log"
	"os"

	"database/internal/config"
	"database/internal/database"
	"database/internal/handlers"
	"database/internal/middleware"
	"database/internal/ws"
	"database/migrations"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func main() {
	// 1. Загрузка конфигурации
	cfg := config.Load()

	// 2. Подключение к БД
	db, err := database.Connect(cfg.DBDsn)
	if err != nil {
		log.Fatal("❌ DB connection failed:", err)
	}

	// 3. Запуск миграций
	if len(os.Args) > 1 && os.Args[1] == "--migrate" {
		log.Println("⏳ Force running migrations...")
		if err := migrations.ForceRunMigrations(db); err != nil {
			log.Fatal("❌ Migration failed:", err)
		}
		log.Println("✅ Migrations completed!")
	} else {
		if err := migrations.RunMigrations(db); err != nil {
			log.Fatal("❌ Migration failed:", err)
		}
	}

	// 4. Инициализация WebSocket Hub
	hub := ws.NewHub()
	go hub.Run()
	log.Println("✅ WebSocket Hub started")

	// 5. Настройка Gin
	router := gin.Default()
	router.Use(middleware.CORS())

	// Статичні файли
	router.Static("/web", "./web")
	
	// Редірект з головної на login
	router.GET("/", func(c *gin.Context) {
		c.Redirect(302, "/web/login.html")
	})

	// 6. Настройка роутов
	setupRoutes(router, db, hub, cfg)

	// 7. Запуск сервера
	log.Printf("🚀 Server starting on port %s\n", cfg.Port)
	log.Printf("🌐 Open: http://localhost:%s/web/login.html\n", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatal("❌ Server failed:", err)
	}
}

func setupRoutes(r *gin.Engine, db *gorm.DB, hub *ws.Hub, cfg *config.Config) {
	if cfg.JWTSecret == "" {
		log.Println("⚠️ ВНИМАНИЕ: JWT_SECRET пустой! Авторизация не будет работать.")
	}
	
	// ========== DEBUG ==========
	// Этот маршрут генерирует тестовые данные для проверки (Стереть базу и добавить 20 клиентов и админов)
	if os.Getenv("BIGWASH_ENABLE_DEBUG_SEED") == "true" {
		seedHandler := handlers.NewSeedHandler(db)
		r.GET("/api/v1/debug/seed", seedHandler.SeedData)
	}

	// Регистр роута для получения всех клиентов (для фронта Svelte)
	r.GET("/api/v1/clients", handlers.GetClientsHandler(db))

	// ========== PUBLIC ROUTES ==========
	authHandler := handlers.NewAuthHandler(db, cfg.JWTSecret)
	r.POST("/api/v1/auth/register", authHandler.Register)
	r.POST("/api/v1/auth/login", authHandler.Login)
	
	// Panel Auth (для пультов)
	r.POST("/api/login", authHandler.PanelLogin)

	// ========== WEBSOCKET ==========
	wsHandler := handlers.NewWSHandler(hub)
	r.GET("/api/v1/ws", wsHandler.Handle)

	// ========== PANEL API (для пультов) ==========
	panelAPI := r.Group("/api")
	panelAPI.Use(middleware.PanelAuthMiddleware(cfg.JWTSecret))
	{
		// Control Panel
		panelHandler := handlers.NewControlPanelHandler(db, hub)
		panelAPI.GET("/panel/init", panelHandler.InitPanel)
		panelAPI.POST("/panel/change/mode", panelHandler.ChangeMode)
		panelAPI.GET("/panel/ping", panelHandler.Ping)
		panelAPI.GET("/get/server/date", panelHandler.GetServerDate)

		// Cards (для пультів)
		cardHandler := handlers.NewCardHandler(db, hub)
		panelAPI.GET("/card/info/:uuid", cardHandler.GetCardInfo)
		panelAPI.GET("/get/client/by/card", cardHandler.GetClientByCard)
		panelAPI.POST("/client/card/create", cardHandler.CreateClientCard)
		panelAPI.POST("/client/card/income", cardHandler.IncomeClientCard)

		// Transactions
		transactionHandler := handlers.NewTransactionHandler(db, hub)
		panelAPI.POST("/make/transaction/card", transactionHandler.MakeTransactionByCard)
		panelAPI.POST("/make/transaction/cash", transactionHandler.MakeTransactionByCash)
		panelAPI.POST("/make/transaction/paypass", transactionHandler.MakeTransactionByPaypass)
		panelAPI.POST("/send/info/cash_holder", transactionHandler.SendCashHolderInfo)

		// Programs
		programHandler := handlers.NewProgramHandler(db, hub)
		panelAPI.GET("/list/programs", programHandler.ListForPanel)
		panelAPI.GET("/list/discounts", programHandler.ListDiscounts)

		// Car Wash
		carWashHandler := handlers.NewCarWashHandler(db)
		panelAPI.GET("/car-wash/info", carWashHandler.GetInfo)
	}

	// ========== ADMIN API (защищено JWT) ==========
	api := r.Group("/api/v1")
	api.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	{
		// Control Panels
		panelHandler := handlers.NewControlPanelHandler(db, hub)
		panels := api.Group("/control-panels")
		{
			panels.GET("", panelHandler.List)
			panels.GET("/:id", panelHandler.Get)
			panels.POST("", panelHandler.Create)
			panels.PUT("/:id", panelHandler.Update)
			panels.DELETE("/:id", panelHandler.Delete)
			panels.POST("/:id/copy", panelHandler.Copy)
			panels.POST("/:id/reboot", panelHandler.Reboot)
			panels.GET("/generate-password", panelHandler.GeneratePassword)
		}

		// Car Washes
		carWashHandler := handlers.NewCarWashHandler(db)
		carWashes := api.Group("/car-washes")
		{
			carWashes.GET("", carWashHandler.List)
			carWashes.GET("/:id", carWashHandler.Get)
			carWashes.POST("", carWashHandler.Create)
			carWashes.PUT("/:id", carWashHandler.Update)
			carWashes.DELETE("/:id", carWashHandler.Delete)
		}

		// Programs
		programHandler := handlers.NewProgramHandler(db, hub)
		programs := api.Group("/programs")
		{
			programs.GET("", programHandler.List)
			programs.GET("/:id", programHandler.Get)
			programs.POST("", programHandler.Create)
			programs.PUT("/:id", programHandler.Update)
			programs.DELETE("/:id", programHandler.Delete)
		}

		// ========== ADMINISTRATORS ==========
		adminHandler := handlers.NewAdminHandler(db)
		admins := api.Group("/admins")
		{
			admins.GET("", adminHandler.List) // Добавлено получение всех админов
			admins.GET("/stats", adminHandler.GetStats)
			admins.GET("/:id", adminHandler.Get)
			admins.POST("", adminHandler.Create)
			admins.PUT("/:id", adminHandler.Update)
			admins.DELETE("/:id", adminHandler.Delete)
		}

		// ========== CARDS ==========
		cardHandler := handlers.NewCardHandler(db, hub)
		cards := api.Group("/cards")
		{
			// CRUD операції
			cards.GET("", cardHandler.List)                  // GET /api/v1/cards
			cards.GET("/stats", cardHandler.GetStats)        // GET /api/v1/cards/stats
			cards.GET("/:id", cardHandler.Get)               // GET /api/v1/cards/:id
			cards.POST("", cardHandler.Create)               // POST /api/v1/cards
			cards.PUT("/:id", cardHandler.Update)            // PUT /api/v1/cards/:id
			cards.DELETE("/:id", cardHandler.Delete)         // DELETE /api/v1/cards/:id
			
			// Спеціальні дії
			cards.POST("/:id/replenish", cardHandler.Replenish)      // POST /api/v1/cards/:id/replenish
			cards.POST("/:id/block", cardHandler.Block)              // POST /api/v1/cards/:id/block
			cards.POST("/:id/last-used", cardHandler.UpdateLastUsed) // POST /api/v1/cards/:id/last-used
		}

		// ========== STATISTICS ==========
		statsHandler := handlers.NewStatsHandler(db)
		stats := api.Group("/stats")
		{
			// Отримання статистики
			stats.GET("/dashboard", statsHandler.GetDashboardStats)       
			stats.GET("/monthly-chart", statsHandler.GetMonthlyChart)     
			stats.GET("/payment-methods", statsHandler.GetPaymentMethods) 
			stats.GET("/activities", statsHandler.GetActivities)          

			// Оновлення статистики
			stats.PUT("/daily", statsHandler.UpdateDailyStats)  
			stats.POST("/activities", statsHandler.AddActivity) 

			// Видалення
			stats.DELETE("/all", statsHandler.DeleteAllStats) 
		}
	}
}