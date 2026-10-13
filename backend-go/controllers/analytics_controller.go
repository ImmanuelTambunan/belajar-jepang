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
// GetAnalyticsOverview aggregates overall progress, memorization, and exam performance.
// GET /api/analytics/overview
func GetAnalyticsOverview(c *fiber.Ctx) error {
	script := c.Query("script")
	if script == "" {
		script = c.Query("type")
	}
	if script == "" {
		script = "hiragana"
	}

	charQuery := config.DB.Model(&models.Character{})
	if script != "all" {
		charQuery = charQuery.Where("script_type = ? OR type = ?", script, script)
	}

	var totalCharacters int64
	charQuery.Count(&totalCharacters)

	if totalCharacters == 0 {
		totalCharacters = 107
	}

	memorizedQuery := config.DB.Model(&models.UserCharacterProgress{}).
		Joins("JOIN `characters` ON `characters`.`id` = `user_character_progress`.`character_id`").
		Where("`user_character_progress`.`status` = ?", "memorized")
	if script != "all" {
		memorizedQuery = memorizedQuery.Where("`characters`.`script_type` = ? OR `characters`.`type` = ?", script, script)
	}
	var memorizedCount int64
	memorizedQuery.Count(&memorizedCount)

	learningQuery := config.DB.Model(&models.UserCharacterProgress{}).
		Joins("JOIN `characters` ON `characters`.`id` = `user_character_progress`.`character_id`").
		Where("`user_character_progress`.`status` = ?", "learning")
	if script != "all" {
		learningQuery = learningQuery.Where("`characters`.`script_type` = ? OR `characters`.`type` = ?", script, script)
	}
	var activeLearningCount int64
	learningQuery.Count(&activeLearningCount)

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
	accQuery := config.DB.Model(&models.UserCharacterProgress{}).
		Joins("JOIN `characters` ON `characters`.`id` = `user_character_progress`.`character_id`").
		Select("COALESCE(AVG(`user_character_progress`.`accuracy_score`), 0) as avg_accuracy, COALESCE(SUM(`user_character_progress`.`review_count`), 0) as total_review").
		Where("`user_character_progress`.`accuracy_score` IS NOT NULL AND `user_character_progress`.`accuracy_score` > 0")
	if script != "all" {
		accQuery = accQuery.Where("`characters`.`script_type` = ? OR `characters`.`type` = ?", script, script)
	}
	accQuery.Scan(&accResult)

	// Exam performance aggregates
	type ExamAggregate struct {
		TotalExams int64
		AvgScore   float64
	}
	var examAgg ExamAggregate
	examQuery := config.DB.Model(&models.ExamResult{}).
		Select("COUNT(*) as total_exams, COALESCE(AVG(score), 0) as avg_score")
	if script != "all" {
		examQuery = examQuery.Where("script_type = ?", script)
	}
	examQuery.Scan(&examAgg)

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
		"script": script,
		"data":   overview,
	})
}

// GetAccuracyByRow computes average tracing accuracy and memorization grouped by Gojuon row.
// GET /api/analytics/accuracy-by-row
func GetAccuracyByRow(c *fiber.Ctx) error {
	script := c.Query("script")
	if script == "" {
		script = c.Query("type")
	}
	if script == "" {
		script = "hiragana"
	}

	// Row group definitions for Hiragana or Katakana
	var rowDefinitions []struct {
		RowGroup   string
		Label      string
		SampleKana string
	}

	if script == "katakana" {
		rowDefinitions = []struct {
			RowGroup   string
			Label      string
			SampleKana string
		}{
			{"vowel", "Baris A (Vokal)", "ア, イ, ウ, エ, オ"},
			{"ka", "Baris Ka", "カ, キ, ク, ケ, コ"},
			{"sa", "Baris Sa", "サ, シ, ス, セ, ソ"},
			{"ta", "Baris Ta", "タ, チ, ツ, テ, ト"},
			{"na", "Baris Na", "ナ, ニ, ヌ, ネ, ノ"},
			{"ha", "Baris Ha", "ハ, ヒ, フ, ヘ, ホ"},
			{"ma", "Baris Ma", "マ, ミ, ム, メ, モ"},
			{"ya", "Baris Ya", "ヤ, ユ, ヨ"},
			{"ra", "Baris Ra", "ラ, リ, ル, レ, ロ"},
			{"wa", "Baris Wa / N", "ワ, ヲ, ン"},
			{"ga", "Dakuon Ga", "ガ, ギ, グ, ゲ, ゴ"},
			{"za", "Dakuon Za", "ザ, ジ, ズ, ゼ, ゾ"},
			{"da", "Dakuon Da", "ダ, ヂ, ヅ, デ, ド"},
			{"ba", "Dakuon Ba", "バ, ビ, ブ, ベ, ボ"},
			{"pa", "Handakuon Pa", "パ, ピ, プ, ペ, ポ"},
			{"yoon", "Gabungan Yōon", "キャ, シュ, チョ, ..."},
		}
	} else if script == "all" {
		rowDefinitions = []struct {
			RowGroup   string
			Label      string
			SampleKana string
		}{
			{"vowel", "Baris A (Vokal)", "あ/ア, い/イ, う/ウ, ..."},
			{"ka", "Baris Ka", "か/カ, き/キ, く/ク, ..."},
			{"sa", "Baris Sa", "さ/サ, し/シ, す/ス, ..."},
			{"ta", "Baris Ta", "た/タ, ち/チ, つ/ツ, ..."},
			{"na", "Baris Na", "な/ナ, に/ニ, ぬ/ヌ, ..."},
			{"ha", "Baris Ha", "は/ハ, ひ/ヒ, ふ/フ, ..."},
			{"ma", "Baris Ma", "ま/マ, み/ミ, む/ム, ..."},
			{"ya", "Baris Ya", "や/ヤ, ゆ/ユ, よ/ヨ"},
			{"ra", "Baris Ra", "ら/ラ, り/リ, る/ル, ..."},
			{"wa", "Baris Wa / N", "わ/ワ, を/ヲ, ん/ン"},
			{"ga", "Dakuon Ga", "が/ガ, ぎ/ギ, ぐ/グ, ..."},
			{"za", "Dakuon Za", "ざ/ザ, じ/ジ, ず/ズ, ..."},
			{"da", "Dakuon Da", "だ/ダ, ぢ/ヂ, づ/ヅ, ..."},
			{"ba", "Dakuon Ba", "ば/バ, び/ビ, ぶ/ブ, ..."},
			{"pa", "Handakuon Pa", "ぱ/パ, ぴ/ピ, ぷ/プ, ..."},
			{"yoon", "Gabungan Yōon", "きゃ/キャ, しゃ/シャ, ..."},
		}
	} else {
		rowDefinitions = []struct {
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
			{"ga", "Dakuon Ga", "が, ぎ, ぐ, げ, ご"},
			{"za", "Dakuon Za", "ざ, じ, ず, ぜ, ぞ"},
			{"da", "Dakuon Da", "だ, ぢ, づ, で, ど"},
			{"ba", "Dakuon Ba", "ば, び, ぶ, べ, ぼ"},
			{"pa", "Handakuon Pa", "ぱ, ぴ, ぷ, ぺ, ぽ"},
			{"yoon", "Gabungan Yōon", "きゃ, しゃ, ちゃ, ..."},
		}
	}

	// Fetch characters for the specified script
	var characters []models.Character
	charFetch := config.DB.Model(&models.Character{})
	if script != "all" {
		charFetch = charFetch.Where("script_type = ? OR type = ?", script, script)
	}
	charFetch.Find(&characters)

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
			cat := strings.ToLower(strings.TrimSpace(c.Category))
			if def.RowGroup == "wa" {
				if rg == "wa" || rg == "n" || rg == "wa_n" {
					charsInRow = append(charsInRow, c)
				}
			} else if def.RowGroup == "yoon" {
				if cat == "yoon" {
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
