package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// GetEnv retrieves environment variables or falls back to default.
func GetEnv(key, fallback string) string {
	if val, exists := os.LookupEnv(key); exists && val != "" {
		return val
	}
	return fallback
}

// ConnectDatabase initializes connection to MySQL Laragon and creates DB if not present.
func ConnectDatabase() *gorm.DB {
	dbUser := GetEnv("DB_USERNAME", "root")
	dbPass := GetEnv("DB_PASSWORD", "root")
	dbHost := GetEnv("DB_HOST", "127.0.0.1")
	dbPort := GetEnv("DB_PORT", "3306")
	dbName := GetEnv("DB_DATABASE", "belajar_jepang")

	// 1. Ensure database exists in MySQL
	dsnRoot := fmt.Sprintf("%s:%s@tcp(%s:%s)/?charset=utf8mb4&parseTime=True&loc=Local",
		dbUser, dbPass, dbHost, dbPort)

	rawDB, err := sql.Open("mysql", dsnRoot)
	if err == nil {
		defer rawDB.Close()
		_, _ = rawDB.Exec(fmt.Sprintf("CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;", dbName))
	}

	// 2. Connect to the target database with GORM
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		dbUser, dbPass, dbHost, dbPort, dbName)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatalf("❌ Gagal terhubung ke MySQL (%s:%s): %v\nPastikan MySQL Laragon sudah di-Start di port %s!", dbHost, dbPort, err, dbPort)
	}

	log.Printf("✅ Berhasil terhubung ke MySQL Laragon [%s:%s/%s]", dbHost, dbPort, dbName)
	DB = db
	return db
}
