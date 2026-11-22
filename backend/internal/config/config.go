package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBDsn     string
	JWTSecret string
	Port      string
}

func Load() *Config {
	// Загружаем .env (игнорируем ошибку если нет файла)
	_ = godotenv.Load()

	cfg := &Config{
		DBDsn:     getEnv("DB_DSN", ""),
		JWTSecret: getEnv("JWT_SECRET", ""),
		Port:      getEnv("PORT", "8080"),
	}

	if cfg.DBDsn == "" {
		log.Fatal("DB_DSN is required; create backend/.env from backend/.env.example")
	}
	if cfg.JWTSecret == "" {
		log.Fatal("JWT_SECRET is required; set a unique secret in backend/.env")
	}

	return cfg
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
