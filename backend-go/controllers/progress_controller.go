package controllers

import (
	"math"
	"time"

	"belajar-jepang-api/config"
	"belajar-jepang-api/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// ProgressSummaryResponse holds aggregated statistics of character memorization.
type ProgressSummaryResponse struct {
	TotalCharacters     int64   `json:"total_characters"`
	MemorizedCount      int64   `json:"memorized_count"`
	LearningCount       int64   `json:"learning_count"`
	ActiveLearningCount int64   `json:"active_learning_count"`
	Percentage          float64 `json:"percentage"`
}

// GetProgressSummary returns the count of characters learning vs memorized.
// GET /api/progress/summary
func GetProgressSummary(c *fiber.Ctx) error {
	var totalCharacters int64
	config.DB.Model(&models.Character{}).
		Where("script_type = ? OR type = ?", "hiragana", "hiragana").
		Count(&totalCharacters)

	if totalCharacters == 0 {
		totalCharacters = 46 // default standard Gojūon
	}

	var memorizedCount int64
	config.DB.Model(&models.UserCharacterProgress{}).
		Where("status = ?", "memorized").
		Count(&memorizedCount)

	var activeLearningCount int64
	config.DB.Model(&models.UserCharacterProgress{}).
		Where("status = ?", "learning").
		Count(&activeLearningCount)

	learningCount := totalCharacters - memorizedCount
	if learningCount < 0 {
		learningCount = 0
	}

	percentage := 0.0
	if totalCharacters > 0 {
		percentage = math.Round((float64(memorizedCount)/float64(totalCharacters))*10000) / 100
	}

	summary := ProgressSummaryResponse{
		TotalCharacters:     totalCharacters,
		MemorizedCount:      memorizedCount,
		LearningCount:       learningCount,
		ActiveLearningCount: activeLearningCount,
		Percentage:          percentage,
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   summary,
	})
}

// UpdateProgressRequest defines payload for updating practice progress.
type UpdateProgressRequest struct {
	CharacterID     uint   `json:"character_id"`
	Status          string `json:"status"` // "learning" or "memorized"
	IncrementReview *bool  `json:"increment_review"`
}

// UpdateProgress saves or updates progress for a character.
// POST /api/progress/update
func UpdateProgress(c *fiber.Ctx) error {
	var req UpdateProgressRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "Format request tidak valid: " + err.Error(),
		})
	}

	if req.CharacterID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "character_id wajib diisi",
		})
	}

	// Validate character exists
	var char models.Character
	if err := config.DB.First(&char, req.CharacterID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"status":  "error",
			"message": "Karakter tidak ditemukan dalam database",
		})
	}

	// Validate status
	status := req.Status
	if status != "" && status != "learning" && status != "memorized" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "status harus berupa 'learning' atau 'memorized'",
		})
	}
	if status == "" {
		status = "learning"
	}

	// Find or create progress record
	var progress models.UserCharacterProgress
	err := config.DB.Where(models.UserCharacterProgress{CharacterID: req.CharacterID}).
		FirstOrCreate(&progress).Error
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Gagal menyimpan progres: " + err.Error(),
		})
	}

	// Update fields
	progress.Status = status
	if req.IncrementReview == nil || *req.IncrementReview {
		progress.ReviewCount++
	}
	now := time.Now()
	progress.LastPracticedAt = &now

	if err := config.DB.Save(&progress).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Gagal memperbarui progres: " + err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Progres karakter berhasil diperbarui",
		"data":    progress,
	})
}

// GetPracticeQueue retrieves a prioritized queue of characters for practice.
// Prioritizes "learning" status or unpracticed characters, ordered by review_count ASC.
// GET /api/progress/practice-queue
func GetPracticeQueue(c *fiber.Ctx) error {
	query := config.DB.
		Table("characters").
		Select("characters.*").
		Joins("LEFT JOIN user_character_progress ON user_character_progress.character_id = characters.id").
		Preload("Readings").
		Preload("Strokes", func(db *gorm.DB) *gorm.DB {
			return db.Order("character_strokes.stroke_number ASC")
		}).
		Where("characters.script_type = ? OR characters.type = ?", "hiragana", "hiragana")

	if row := c.Query("row"); row != "" {
		query = query.Where("characters.row_group = ?", row)
	}

	if mode := c.Query("mode"); mode == "unmemorized" {
		query = query.Where("user_character_progress.status IS NULL OR user_character_progress.status != ?", "memorized")
	}

	// Prioritize: unmemorized/learning first, least reviewed first, then character ID
	query = query.Order("CASE WHEN user_character_progress.status = 'memorized' THEN 1 ELSE 0 END ASC, COALESCE(user_character_progress.review_count, 0) ASC, characters.id ASC")

	limit := c.QueryInt("limit", 15)
	if limit > 0 {
		query = query.Limit(limit)
	}

	var characters []models.Character
	if err := query.Find(&characters).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Gagal mengambil antrean latihan: " + err.Error(),
		})
	}

	// Fetch progress map for these characters
	progressMap := make(map[uint]models.UserCharacterProgress)
	if len(characters) > 0 {
		var charIDs []uint
		for _, ch := range characters {
			charIDs = append(charIDs, ch.ID)
		}
		var progresses []models.UserCharacterProgress
		config.DB.Where("character_id IN ?", charIDs).Find(&progresses)
		for _, p := range progresses {
			progressMap[p.CharacterID] = p
		}
	}

	return c.JSON(fiber.Map{
		"status":   "success",
		"count":    len(characters),
		"data":     characters,
		"progress": progressMap,
	})
}
