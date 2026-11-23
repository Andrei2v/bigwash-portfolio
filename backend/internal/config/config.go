package config

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	DBDsn     string
	JWTSecret string
	Port      string
	BindHost  string
	LocalDev  bool
}

func Load() *Config {
	// Загружаем .env (игнорируем ошибку если нет файла)
	_ = godotenv.Load()

	cfg := &Config{
		DBDsn:     getEnv("DB_DSN", ""),
		JWTSecret: getEnv("JWT_SECRET", ""),
		Port:      getEnv("PORT", "8080"),
		BindHost:  getEnv("BIGWASH_BIND_HOST", "127.0.0.1"),
		LocalDev:  os.Getenv("BIGWASH_ENV") == "development",
	}

	if cfg.DBDsn == "" {
		log.Fatal("DB_DSN is required; create backend/.env from backend/.env.example")
	}
	if len(strings.TrimSpace(cfg.JWTSecret)) < 32 || cfg.JWTSecret == "REPLACE_WITH_A_LONG_RANDOM_SECRET" {
		log.Fatal("JWT_SECRET must be a unique random secret of at least 32 characters")
	}

	if cfg.LocalDev && cfg.BindHost != "127.0.0.1" && cfg.BindHost != "::1" {
		log.Fatal("development API requires a loopback bind address")
	}
	return cfg
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
