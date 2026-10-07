package controllers

import (
	"time"

	"belajar-jepang-api/config"
	"belajar-jepang-api/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// GetHiraganaCharacters returns all hiragana characters with readings and ordered strokes.
func GetHiraganaCharacters(c *fiber.Ctx) error {
	var characters []models.Character

	err := config.DB.
		Preload("Readings").
		Preload("Strokes", func(db *gorm.DB) *gorm.DB {
			return db.Order("character_strokes.stroke_order ASC")
		}).
		Where("type = ?", "hiragana").
		Order("id ASC").
		Find(&characters).Error

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Gagal mengambil data karakter Hiragana: " + err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"type":   "hiragana",
		"count":  len(characters),
		"data":   characters,
	})
}

// GetAllCharacters retrieves characters with optional type and jlpt_level filters.
func GetAllCharacters(c *fiber.Ctx) error {
	var characters []models.Character
	query := config.DB.
		Preload("Readings").
		Preload("Strokes", func(db *gorm.DB) *gorm.DB {
			return db.Order("character_strokes.stroke_order ASC")
		})

	if charType := c.Query("type"); charType != "" {
		query = query.Where("type = ?", charType)
	}

	if jlpt := c.Query("jlpt_level"); jlpt != "" {
		query = query.Where("jlpt_level = ?", jlpt)
	}

	if err := query.Order("id ASC").Find(&characters).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Gagal mengambil data karakter: " + err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"count":  len(characters),
		"data":   characters,
	})
}

// GetCharacterDetail retrieves a single character by ID or character literal.
func GetCharacterDetail(c *fiber.Ctx) error {
	idOrChar := c.Params("id")
	var character models.Character

	err := config.DB.
		Preload("Readings").
		Preload("Strokes", func(db *gorm.DB) *gorm.DB {
			return db.Order("character_strokes.stroke_order ASC")
		}).
		Where("id = ? OR character = ?", idOrChar, idOrChar).
		First(&character).Error

	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"status":  "error",
			"message": "Karakter tidak ditemukan",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   character,
	})
}

// HealthCheck verifies backend API health status.
func HealthCheck(c *fiber.Ctx) error {
	// Verify database connection ping
	sqlDB, err := config.DB.DB()
	dbStatus := "connected"
	if err != nil || sqlDB.Ping() != nil {
		dbStatus = "disconnected"
	}

	return c.JSON(fiber.Map{
		"status":    "success",
		"message":   "Nihongo Sora Golang Fiber API berjalan normal",
		"database":  dbStatus,
		"timestamp": time.Now().Format(time.RFC3339),
	})
}
