package routes

import (
	"belajar-jepang-api/controllers"
	"github.com/gofiber/fiber/v2"
)

// SetupRoutes registers all API routes into the Fiber application.
func SetupRoutes(app *fiber.App) {
	api := app.Group("/api")

	// Healthcheck endpoint
	api.Get("/health", controllers.HealthCheck)

	// Characters endpoints
	api.Get("/characters/hiragana", controllers.GetHiraganaCharacters)
	api.Get("/characters/katakana", controllers.GetKatakanaCharacters)
	api.Get("/characters", controllers.GetAllCharacters)
	api.Get("/characters/:id", controllers.GetCharacterDetail)

	// Kanji endpoints (Fase 10.1 JLPT N5)
	api.Get("/kanjis", controllers.GetKanjis)
	api.Get("/kanjis/:id", controllers.GetKanjiDetail)

	// Practical Workplace Vocabulary endpoints (Fase 12: Shigoto Nihongo)
	api.Get("/vocabularies", controllers.GetVocabularies)
	api.Get("/vocabularies/:id", controllers.GetVocabularyDetail)

	// User progress & practice memorization endpoints
	progress := api.Group("/progress")
	progress.Get("/summary", controllers.GetProgressSummary)
	progress.Post("/update", controllers.UpdateProgress)
	progress.Get("/practice-queue", controllers.GetPracticeQueue)
	progress.Post("/reset", controllers.ResetProgressAndAnalytics)

	// Exam endpoints
	exam := api.Group("/exam")
	exam.Post("/submit", controllers.SubmitExam)
	exam.Get("/history", controllers.GetExamHistory)

	// Analytics & Statistics Dashboard endpoints
	analytics := api.Group("/analytics")
	analytics.Get("/overview", controllers.GetAnalyticsOverview)
	analytics.Get("/accuracy-by-row", controllers.GetAccuracyByRow)
	analytics.Get("/exam-history", controllers.GetExamHistoryAnalytics)
	analytics.Delete("/reset", controllers.ResetProgressAndAnalytics)
	analytics.Post("/reset", controllers.ResetProgressAndAnalytics)
}
