package controllers

import (
	"strconv"
	"strings"

	"belajar-jepang-api/config"
	"belajar-jepang-api/models"
	"github.com/gofiber/fiber/v2"
)

// GetVocabularies retrieves a list of practical workplace vocabularies.
// Query params:
// - category: filter by industry category
// - search: search term across word, reading, romaji, meaning_id
func GetVocabularies(c *fiber.Ctx) error {
	var vocabularies []models.Vocabulary
	query := config.DB.Model(&models.Vocabulary{})

	// Filter by Category
	category := strings.TrimSpace(c.Query("category"))
	if category != "" && category != "all" && category != "semua" {
		query = query.Where("`category` LIKE ?", "%"+category+"%")
	}

	// Filter by Search Keyword
	search := strings.TrimSpace(c.Query("search"))
	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("`word` LIKE ? OR `reading` LIKE ? OR `romaji` LIKE ? OR `meaning_id` LIKE ? OR `meaning_en` LIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
	}

	// Order by ID ascending
	if err := query.Order("id ASC").Find(&vocabularies).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Gagal mengambil data kosakata kerja",
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   vocabularies,
		"meta": fiber.Map{
			"total":    len(vocabularies),
			"category": category,
			"search":   search,
		},
	})
}

// GetVocabularyDetail retrieves detail of a single vocabulary by ID.
func GetVocabularyDetail(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "ID kosakata tidak valid",
		})
	}

	var vocab models.Vocabulary
	if err := config.DB.First(&vocab, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"status":  "error",
			"message": "Kosakata tidak ditemukan",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   vocab,
	})
}