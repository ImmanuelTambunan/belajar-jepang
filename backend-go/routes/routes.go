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
	api.Get("/characters", controllers.GetAllCharacters)
	api.Get("/characters/:id", controllers.GetCharacterDetail)
}
