package controllers

import (
	"strconv"
	"strings"
	"time"

	"belajar-jepang-api/config"
	"belajar-jepang-api/models"
	"github.com/gofiber/fiber/v2"
)

// SubmitExamRequest holds the quiz payload sent from the client.
type SubmitExamRequest struct {
	ScriptType        string `json:"script_type"` // "hiragana", "katakana", "mixed"
	TotalQuestions    int    `json:"total_questions"`
	CorrectAnswers    int    `json:"correct_answers"`
	Score             int    `json:"score"`
	DurationSeconds   int    `json:"duration_seconds"`
	WrongCharacterIDs []uint `json:"wrong_character_ids"`
}

// SubmitExam records the exam attempt and adjusts learning progress for incorrect characters.
// POST /api/exam/submit
func SubmitExam(c *fiber.Ctx) error {
	var req SubmitExamRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "Format payload ujian tidak valid: " + err.Error(),
		})
	}

	if req.TotalQuestions <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "total_questions wajib diisi dan harus lebih dari 0",
		})
	}

	// Calculate score if omitted or zero
	score := req.Score
	if score <= 0 && req.TotalQuestions > 0 {
		score = int(float64(req.CorrectAnswers) / float64(req.TotalQuestions) * 100.0)
	}

	// Format wrong IDs as comma-separated string
	var wrongIDsStr []string
	for _, id := range req.WrongCharacterIDs {
		wrongIDsStr = append(wrongIDsStr, strconv.FormatUint(uint64(id), 10))
	}
	wrongIDsJoined := strings.Join(wrongIDsStr, ",")

	scriptType := req.ScriptType
	if scriptType == "" {
		scriptType = "hiragana"
	}

	examRecord := models.ExamResult{
		ScriptType:        scriptType,
		TotalQuestions:    req.TotalQuestions,
		CorrectAnswers:    req.CorrectAnswers,
		Score:             score,
		DurationSeconds:   req.DurationSeconds,
		WrongCharacterIDs: wrongIDsJoined,
		CreatedAt:         time.Now(),
	}

	if err := config.DB.Create(&examRecord).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Gagal menyimpan riwayat ujian: " + err.Error(),
		})
	}

	// Automatic Progress Adjustment:
	// For every character answered incorrectly, set status to 'learning' in user_character_progress
	// so they are automatically prioritized in spaced repetition practice sessions!
	now := time.Now()
	for _, charID := range req.WrongCharacterIDs {
		if charID == 0 {
			continue
		}
		var progress models.UserCharacterProgress
		err := config.DB.Where(models.UserCharacterProgress{CharacterID: charID}).
			FirstOrCreate(&progress).Error
		if err == nil {
			progress.Status = "learning"
			progress.LastPracticedAt = &now
			config.DB.Save(&progress)
		}
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Hasil ujian berhasil disimpan dan prioritas hafalan diperbarui",
		"data":    examRecord,
	})
}

// GetExamHistory retrieves previous exam records.
// GET /api/exam/history
func GetExamHistory(c *fiber.Ctx) error {
	var records []models.ExamResult
	limit := c.QueryInt("limit", 10)
	query := config.DB.Order("created_at DESC")

	if script := c.Query("script"); script != "" && script != "all" {
		query = query.Where("script_type = ?", script)
	}

	if err := query.Limit(limit).Find(&records).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Gagal mengambil histori ujian: " + err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"count":  len(records),
		"data":   records,
	})
}
