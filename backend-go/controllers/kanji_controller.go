package controllers

import (
	"encoding/json"
	"strconv"

	"belajar-jepang-api/config"
	"belajar-jepang-api/models"
	"github.com/gofiber/fiber/v2"
)

// Helper to populate virtual fields (Strokes and ExamplesList) on Kanji models.
func populateKanjiVirtualFields(k *models.Kanji) {
	if k.SvgStrokes != "" {
		var strokes []string
		if err := json.Unmarshal([]byte(k.SvgStrokes), &strokes); err == nil {
			k.Strokes = strokes
		}
	}
	if k.Examples != "" {
		var examples []models.KanjiExample
		if err := json.Unmarshal([]byte(k.Examples), &examples); err == nil {
			k.ExamplesList = examples
		}
	}
}

// GetKanjis retrieves a list of kanjis with optional filters for jlpt level and category.
// Query params:
// - level or jlpt_level: "N5" (default all if empty)
// - category: "numbers", "calendar_time", or "all"
func GetKanjis(c *fiber.Ctx) error {
	var kanjis []models.Kanji
	query := config.DB.Model(&models.Kanji{})

	// Filter by JLPT level
	level := c.Query("level")
	if level == "" {
		level = c.Query("jlpt_level")
	}
	if level != "" && level != "all" {
		query = query.Where("`jlpt_level` = ?", level)
	}

	// Filter by Category
	category := c.Query("category")
	if category != "" && category != "all" {
		switch category {
		case "numbers", "angka", "numbers_quantity":
			query = query.Where("`category` = ?", "numbers")
		case "calendar_time", "waktu", "time", "time_nature", "calendar":
			query = query.Where("`category` = ?", "calendar_time")
		case "people_family", "people", "manusia", "family", "keluarga":
			query = query.Where("`category` = ?", "people_family")
		case "body_parts", "body", "tubuh", "badan":
			query = query.Where("`category` = ?", "body_parts")
		case "direction_size", "direction", "size", "arah", "ukuran", "posisi", "position":
			query = query.Where("`category` = ?", "direction_size")
		case "origin_place", "origin", "place", "asal", "tempat_asal":
			query = query.Where("`category` = ?", "origin_place")
		case "nature_weather", "nature", "weather", "alam", "cuaca":
			query = query.Where("`category` = ?", "nature_weather")
		case "animals", "animal", "hewan", "binatang":
			query = query.Where("`category` = ?", "animals")
		case "school_education", "school", "education", "sekolah", "belajar":
			query = query.Where("`category` = ?", "school_education")
		case "places_transport", "transport", "places", "tempat", "transportasi", "fasilitas":
			query = query.Where("`category` = ?", "places_transport")
		default:
			query = query.Where("`category` = ?", category)
		}
	}

	if err := query.Order("`id` ASC").Find(&kanjis).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Gagal mengambil data Kanji: " + err.Error(),
		})
	}

	for i := range kanjis {
		populateKanjiVirtualFields(&kanjis[i])
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"count":  len(kanjis),
		"data":   kanjis,
	})
}

// GetKanjiDetail retrieves a single kanji by its ID or character symbol.
func GetKanjiDetail(c *fiber.Ctx) error {
	idOrChar := c.Params("id")
	if num, err := strconv.Atoi(idOrChar); err == nil && num > 2000 {
		idOrChar = strconv.Itoa(num - 2000)
	}
	var kanji models.Kanji

	err := config.DB.
		Where("`id` = ? OR `character` = ?", idOrChar, idOrChar).
		First(&kanji).Error

	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"status":  "error",
			"message": "Kanji tidak ditemukan",
		})
	}

	populateKanjiVirtualFields(&kanji)

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   kanji,
	})
}
