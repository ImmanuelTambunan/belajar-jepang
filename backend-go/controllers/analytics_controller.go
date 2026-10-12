package controllers

import (
	"math"
	"strings"
	"time"

	"belajar-jepang-api/config"
	"belajar-jepang-api/models"
	"github.com/gofiber/fiber/v2"
)

// AnalyticsOverviewResponse holds overall learning metrics.
type AnalyticsOverviewResponse struct {
	TotalCharacters     int64   `json:"total_characters"`
	MemorizedCount      int64   `json:"memorized_count"`
	LearningCount       int64   `json:"learning_count"`
	ActiveLearningCount int64   `json:"active_learning_count"`
	CompletionRate      float64 `json:"completion_rate"`
	OverallAccuracyAvg  float64 `json:"overall_accuracy_avg"`
	TotalPracticeCount  int64   `json:"total_practice_count"`
	TotalExamsTaken     int64   `json:"total_exams_taken"`
	ExamAverageScore    float64 `json:"exam_average_score"`
}

// RowAccuracyMetric represents aggregated tracing accuracy by row group.
type RowAccuracyMetric struct {
	RowGroup        string  `json:"row_group"`
	Label           string  `json:"label"`
	SampleKana      string  `json:"sample_kana"`
	TotalCharacters int     `json:"total_characters"`
	MemorizedCount  int     `json:"memorized_count"`
	AverageAccuracy float64 `json:"average_accuracy"`
	TotalReviews    int     `json:"total_reviews"`
	Status          string  `json:"status"` // "proficient", "good", "needs_practice", "unpracticed"
}

// ExamHistoryAnalyticsItem represents formatted exam session entry.
type ExamHistoryAnalyticsItem struct {
	ID              uint      `json:"id"`
	ExamID          uint      `json:"exam_id"`
	TotalQuestions  int       `json:"total_questions"`
	CorrectAnswers  int       `json:"correct_answers"`
	WrongAnswers    int       `json:"wrong_answers"`
	Score           int       `json:"score"`
	DurationSeconds int       `json:"duration_seconds"`
	Grade           string    `json:"grade"`
	GradeLabel      string    `json:"grade_label"`
	CompletedAt     time.Time `json:"completed_at"`
}

// Helper to determine JLPT grade and descriptive label from exam score
func calculateExamGrade(score int) (string, string) {
	if score >= 90 {
		return "S", "Sempurna (Istimewa)"
	}
	if score >= 75 {
		return "A", "Lulus Sangat Memuaskan"
	}
	if score >= 60 {
		return "B", "Lulus Kompeten"
	}
	if score >= 45 {
		return "C", "Perlu Penguatan"
	}
	return "D", "Perlu Diulang"
}

// GetAnalyticsOverview aggregates overall progress, memorization, and exam performance.
// GET /api/analytics/overview
func GetAnalyticsOverview(c *fiber.Ctx) error {
	var totalCharacters int64
	config.DB.Model(&models.Character{}).
		Where("script_type = ? OR type = ?", "hiragana", "hiragana").
		Count(&totalCharacters)

	if totalCharacters == 0 {
		totalCharacters = 46
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

	completionRate := 0.0
	if totalCharacters > 0 {
		completionRate = math.Round((float64(memorizedCount)/float64(totalCharacters))*1000) / 10
	}

	// Overall average accuracy score of stroke tracing
	type AccuracyResult struct {
		AvgAccuracy float64
		TotalReview int64
	}
	var accResult AccuracyResult
	config.DB.Model(&models.UserCharacterProgress{}).
		Select("COALESCE(AVG(accuracy_score), 0) as avg_accuracy, COALESCE(SUM(review_count), 0) as total_review").
		Where("accuracy_score IS NOT NULL AND accuracy_score > 0").
		Scan(&accResult)

	// Exam performance aggregates
	type ExamAggregate struct {
		TotalExams int64
		AvgScore   float64
	}
	var examAgg ExamAggregate
	config.DB.Model(&models.ExamResult{}).
		Select("COUNT(*) as total_exams, COALESCE(AVG(score), 0) as avg_score").
		Scan(&examAgg)

	overview := AnalyticsOverviewResponse{
		TotalCharacters:     totalCharacters,
		MemorizedCount:      memorizedCount,
		LearningCount:       learningCount,
		ActiveLearningCount: activeLearningCount,
		CompletionRate:      completionRate,
		OverallAccuracyAvg:  math.Round(accResult.AvgAccuracy*10) / 10,
		TotalPracticeCount:  accResult.TotalReview,
		TotalExamsTaken:     examAgg.TotalExams,
		ExamAverageScore:    math.Round(examAgg.AvgScore*10) / 10,
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   overview,
	})
}

// GetAccuracyByRow computes average tracing accuracy and memorization grouped by Gojuon row.
// GET /api/analytics/accuracy-by-row
func GetAccuracyByRow(c *fiber.Ctx) error {
	// Standard Hiragana row group definitions
	rowDefinitions := []struct {
		RowGroup   string
		Label      string
		SampleKana string
	}{
		{"vowel", "Baris A (Vokal)", "あ, い, う, え, お"},
		{"ka", "Baris Ka", "か, き, く, け, こ"},
		{"sa", "Baris Sa", "さ, し, す, せ, そ"},
		{"ta", "Baris Ta", "た, ち, つ, て, と"},
		{"na", "Baris Na", "な, に, ぬ, ね, の"},
		{"ha", "Baris Ha", "は, ひ, ふ, へ, ほ"},
		{"ma", "Baris Ma", "ま, み, む, め, も"},
		{"ya", "Baris Ya", "や, ゆ, よ"},
		{"ra", "Baris Ra", "ら, り, る, れ, ろ"},
		{"wa", "Baris Wa / N", "わ, を, ん"},
	}

	// Fetch all characters with their associated progress
	var characters []models.Character
	config.DB.Model(&models.Character{}).
		Where("script_type = ? OR type = ?", "hiragana", "hiragana").
		Find(&characters)

	// Fetch all user progress records
	var allProgress []models.UserCharacterProgress
	config.DB.Model(&models.UserCharacterProgress{}).Find(&allProgress)

	progressMap := make(map[uint]models.UserCharacterProgress)
	for _, p := range allProgress {
		progressMap[p.CharacterID] = p
	}

	var results []RowAccuracyMetric

	for _, def := range rowDefinitions {
		var charsInRow []models.Character
		for _, c := range characters {
			rg := strings.ToLower(strings.TrimSpace(c.RowGroup))
			if def.RowGroup == "wa" {
				if rg == "wa" || rg == "n" || rg == "wa_n" {
					charsInRow = append(charsInRow, c)
				}
			} else if rg == def.RowGroup {
				charsInRow = append(charsInRow, c)
			}
		}

		totalChars := len(charsInRow)
		if totalChars == 0 {
			// Fallback standard counts if database not yet populated
			if def.RowGroup == "ya" || def.RowGroup == "wa" {
				totalChars = 3
			} else {
				totalChars = 5
			}
		}

		memorizedCount := 0
		totalReviews := 0
		var accuracyScores []float64

		for _, char := range charsInRow {
			if prog, ok := progressMap[char.ID]; ok {
				if prog.Status == "memorized" {
					memorizedCount++
				}
				totalReviews += prog.ReviewCount
				if prog.AccuracyScore != nil && *prog.AccuracyScore > 0 {
					accuracyScores = append(accuracyScores, *prog.AccuracyScore)
				}
			}
		}

		avgAcc := 0.0
		if len(accuracyScores) > 0 {
			sum := 0.0
			for _, score := range accuracyScores {
				sum += score
			}
			avgAcc = math.Round((sum/float64(len(accuracyScores)))*10) / 10
		}

		status := "unpracticed"
		if avgAcc >= 85 {
			status = "proficient"
		} else if avgAcc >= 70 {
			status = "good"
		} else if avgAcc > 0 {
			status = "needs_practice"
		}

		results = append(results, RowAccuracyMetric{
			RowGroup:        def.RowGroup,
			Label:           def.Label,
			SampleKana:      def.SampleKana,
			TotalCharacters: totalChars,
			MemorizedCount:  memorizedCount,
			AverageAccuracy: avgAcc,
			TotalReviews:    totalReviews,
			Status:          status,
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"count":  len(results),
		"data":   results,
	})
}

// GetExamHistoryAnalytics returns past exam attempts formatted for dashboard visualization.
// GET /api/analytics/exam-history
func GetExamHistoryAnalytics(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 20)
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	var records []models.ExamResult
	if err := config.DB.Order("created_at DESC").Limit(limit).Find(&records).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Gagal mengambil riwayat ujian: " + err.Error(),
		})
	}

	var formatted []ExamHistoryAnalyticsItem
	for _, rec := range records {
		wrong := rec.TotalQuestions - rec.CorrectAnswers
		if wrong < 0 {
			wrong = 0
		}

		grade, label := calculateExamGrade(rec.Score)

		formatted = append(formatted, ExamHistoryAnalyticsItem{
			ID:              rec.ID,
			ExamID:          rec.ID,
			TotalQuestions:  rec.TotalQuestions,
			CorrectAnswers:  rec.CorrectAnswers,
			WrongAnswers:    wrong,
			Score:           rec.Score,
			DurationSeconds: rec.DurationSeconds,
			Grade:           grade,
			GradeLabel:      label,
			CompletedAt:     rec.CreatedAt,
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"count":  len(formatted),
		"data":   formatted,
	})
}
