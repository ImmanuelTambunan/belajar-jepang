package main

import (
	"log"

	"belajar-jepang-api/config"
	"belajar-jepang-api/database"
	"belajar-jepang-api/routes"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	log.Println("🎌 Memulai Backend Nihongo Sora (Golang Fiber)...")

	// 1. Initialize Database connection
	db := config.ConnectDatabase()

	// 2. Run AutoMigrate & Seeder
	if err := database.AutoMigrate(db); err != nil {
		log.Printf("⚠️ Peringatan saat migrasi database: %v", err)
	}
	if err := database.SeedHiraganaDataset(db); err != nil {
		log.Printf("⚠️ Peringatan saat seeding Hiragana dataset: %v", err)
	}

	// 3. Initialize Fiber App
	app := fiber.New(fiber.Config{
		AppName: "Nihongo Sora API v2.0 (Golang Fiber)",
	})

	// 4. Middlewares
	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} - ${latency} ${method} ${path}\n",
	}))

	// CORS configuration for Next.js (port 3000)
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000, http://127.0.0.1:3000, http://localhost:5173",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: false,
	}))

	// 5. Register Routes
	routes.SetupRoutes(app)

	// 6. Start Server on Port 8000
	port := config.GetEnv("PORT", "8000")
	log.Printf("🚀 Server siap melayani request di http://localhost:%s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("❌ Gagal menjalankan server: %v", err)
	}
}
