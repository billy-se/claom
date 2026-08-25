package config

import (
	"log"
	"os"
)

type Config struct {
	DSN  string
	Port string
}

func Getenv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func Load() *Config {
	dsn := os.Getenv("DSN")

	if dsn == "" {
		log.Println("Warning: dsn not set, using default local configuration")
		dsn = "postgres://postgres:password@localhost:5432/your_db_name?sslmode=disable"
	}

	Port := os.Getenv("PORT")
	if Port == "" {
		Port = "2026"
	}

	return &Config{
		DSN:  dsn,
		Port: Port,
	}
}
