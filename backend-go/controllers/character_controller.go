package controllers

import (
	"time"

	"belajar-jepang-api/config"
	"belajar-jepang-api/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// GetHiraganaCharacters returns all hiragana characters with readings and ordered strokes.
// Supports optional query parameter `?row=...` to filter by row_group (e.g. vowel, ka, sa, etc.).
func GetHiraganaCharacters(c *fiber.Ctx) error {
	var characters []models.Character

	query := config.DB.
		Preload("Readings").
		Preload("Strokes", func(db *gorm.DB) *gorm.DB {
			return db.Order("`character_strokes`.`stroke_number` ASC")
		}).
		Where("`script_type` = ? OR `type` = ?", "hiragana", "hiragana")

	// Optional query parameter ?row=... to filter by row_group
	if row := c.Query("row"); row != "" {
		query = query.Where("`row_group` = ?", row)
	}

	// Optional query parameter ?category=... (gojuon, dakuon, handakuon, yoon, dakuon_handakuon)
	if category := c.Query("category"); category != "" && category != "all" {
		if category == "dakuon_handakuon" || category == "dakuon_and_handakuon" {
			query = query.Where("`category` IN (?, ?)", "dakuon", "handakuon")
		} else {
			query = query.Where("`category` = ?", category)
		}
	}

	if err := query.Order("`characters`.`id` ASC").Find(&characters).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Gagal mengambil data karakter Hiragana: " + err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"type":   "hiragana",
		"script": "hiragana",
		"count":  len(characters),
		"data":   characters,
	})
}

// GetKatakanaCharacters returns all katakana characters with readings and ordered strokes.
// Supports optional query parameter `?row=...` to filter by row_group.
func GetKatakanaCharacters(c *fiber.Ctx) error {
	var characters []models.Character

	query := config.DB.
		Preload("Readings").
		Preload("Strokes", func(db *gorm.DB) *gorm.DB {
			return db.Order("`character_strokes`.`stroke_number` ASC")
		}).
		Where("`script_type` = ? OR `type` = ?", "katakana", "katakana")

	if row := c.Query("row"); row != "" {
		query = query.Where("`row_group` = ?", row)
	}

	if category := c.Query("category"); category != "" && category != "all" {
		if category == "dakuon_handakuon" || category == "dakuon_and_handakuon" {
			query = query.Where("`category` IN (?, ?)", "dakuon", "handakuon")
		} else {
			query = query.Where("`category` = ?", category)
		}
	}

	if err := query.Order("`characters`.`id` ASC").Find(&characters).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Gagal mengambil data karakter Katakana: " + err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"type":   "katakana",
		"script": "katakana",
		"count":  len(characters),
		"data":   characters,
	})
}

// GetAllCharacters retrieves characters with optional script, type, row, category, and jlpt_level filters.
// Defaults ?script=hiragana if not provided. Supports ?script=katakana or ?script=all.
func GetAllCharacters(c *fiber.Ctx) error {
	var characters []models.Character
	query := config.DB.
		Preload("Readings").
		Preload("Strokes", func(db *gorm.DB) *gorm.DB {
			return db.Order("`character_strokes`.`stroke_number` ASC")
		})

	script := c.Query("script")
	if script == "" {
		script = c.Query("type")
	}
	if script == "" {
		script = "hiragana"
	}

	if script != "all" {
		query = query.Where("`script_type` = ? OR `type` = ?", script, script)
	}

	if row := c.Query("row"); row != "" {
		query = query.Where("`row_group` = ?", row)
	}

	if category := c.Query("category"); category != "" && category != "all" {
		if category == "dakuon_handakuon" || category == "dakuon_and_handakuon" {
			query = query.Where("`category` IN (?, ?)", "dakuon", "handakuon")
		} else {
			query = query.Where("`category` = ?", category)
		}
	}

	if jlpt := c.Query("jlpt_level"); jlpt != "" {
		query = query.Where("`jlpt_level` = ?", jlpt)
	}

	if err := query.Order("`characters`.`id` ASC").Find(&characters).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Gagal mengambil data karakter: " + err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"script": script,
		"count":  len(characters),
		"data":   characters,
	})
}

// GetCharacterDetail retrieves a single character by ID, symbol, or character literal.
func GetCharacterDetail(c *fiber.Ctx) error {
	idOrChar := c.Params("id")
	var character models.Character

	err := config.DB.
		Preload("Readings").
		Preload("Strokes", func(db *gorm.DB) *gorm.DB {
			return db.Order("`character_strokes`.`stroke_number` ASC")
		}).
		Where("`id` = ? OR `symbol` = ? OR `character` = ?", idOrChar, idOrChar, idOrChar).
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
