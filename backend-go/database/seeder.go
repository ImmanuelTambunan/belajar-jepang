package database

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	"belajar-jepang-api/models"
	"gorm.io/gorm"
)

// HiraganaItem represents the raw JSON item from hiragana_107.json or hiragana_46.json.
type HiraganaItem struct {
	Symbol      string   `json:"symbol"`
	ScriptType  string   `json:"script_type"`
	Category    string   `json:"category"`
	RowGroup    string   `json:"row_group"`
	StrokeCount int      `json:"stroke_count"`
	Reading     string   `json:"reading"`
	Strokes     []string `json:"strokes"`
}

// AutoMigrate runs GORM AutoMigrate for all models.
func AutoMigrate(db *gorm.DB) error {
	log.Println("🔄 Menjalankan GORM AutoMigrate...")
	err := db.AutoMigrate(
		&models.Character{},
		&models.CharacterReading{},
		&models.CharacterStroke{},
		&models.UserCharacterProgress{},
		&models.ExamResult{},
	)
	if err != nil {
		return fmt.Errorf("gagal migrasi: %w", err)
	}
	log.Println("✅ AutoMigrate berhasil.")
	return nil
}

// SeedHiraganaDataset reads dataset and seeds Hiragana characters (Gojuon, Dakuon, Handakuon, Yoon) using db.FirstOrCreate().
func SeedHiraganaDataset(db *gorm.DB) error {
	log.Println("🌱 Memulai Seeder: Membaca dataset Hiragana...")

	// Ensure binary collation so Japanese dakuten / handakuten / yoon are treated distinctly
	db.Exec("ALTER TABLE `characters` MODIFY `symbol` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL")
	db.Exec("ALTER TABLE `characters` MODIFY `character` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL")

	// Candidates for data file location
	pathsToTry := []string{
		"backend-go/data/hiragana_107.json",
		"backend/data/hiragana_107.json",
		"data/hiragana_107.json",
		"../backend-go/data/hiragana_107.json",
		"../backend/data/hiragana_107.json",
		"backend/data/hiragana_46.json",
		"backend-go/data/hiragana_46.json",
		"data/hiragana_46.json",
		"../backend/data/hiragana_46.json",
		"../backend-go/data/hiragana_46.json",
	}

	var rawData []byte
	var readErr error
	var foundPath string
	for _, p := range pathsToTry {
		data, err := os.ReadFile(p)
		if err == nil {
			rawData = data
			foundPath = p
			break
		}
		readErr = err
	}

	if len(rawData) == 0 {
		return fmt.Errorf("gagal membaca file dataset hiragana (terakhir mencoba %v): %w", pathsToTry, readErr)
	}

	log.Printf("📂 Memuat dataset dari %s (%d bytes)", foundPath, len(rawData))

	var items []HiraganaItem
	if err := json.Unmarshal(rawData, &items); err != nil {
		return fmt.Errorf("gagal parsing JSON dataset: %w", err)
	}

	jlptDefault := "N5"
	seededCount := 0

	for idx, item := range items {
		targetID := uint(idx + 1)
		category := item.Category
		if category == "" {
			category = "gojuon"
		}

		char := models.Character{
			ID:           targetID,
			Symbol:       item.Symbol,
			Character:    item.Symbol,
			ScriptType:   item.ScriptType,
			Type:         item.ScriptType,
			Category:     category,
			RowGroup:     item.RowGroup,
			StrokeCount:  item.StrokeCount,
			StrokesCount: item.StrokeCount,
			JlptLevel:    &jlptDefault,
		}

		// Upsert character by ID
		if err := db.Where("`id` = ?", targetID).
			Assign(char).
			FirstOrCreate(&char).Error; err != nil {
			log.Printf("⚠️ Gagal seeding Character #%d %s: %v", targetID, item.Symbol, err)
			continue
		}

		// Clean old readings & strokes for targetID to avoid duplicates
		db.Where("`character_id` = ?", targetID).Delete(&models.CharacterReading{})
		db.Where("`character_id` = ?", targetID).Delete(&models.CharacterStroke{})

		// Seed CharacterReading
		readingMeaning := fmt.Sprintf("Karakter Hiragana %s (%s)", item.Symbol, item.Reading)
		reading := models.CharacterReading{
			CharacterID: targetID,
			Romaji:      item.Reading,
			Meaning:     &readingMeaning,
		}
		if err := db.Create(&reading).Error; err != nil {
			log.Printf("⚠️ Gagal seeding Reading untuk #%d %s: %v", targetID, item.Symbol, err)
		}

		// Seed CharacterStrokes
		for sIdx, pathData := range item.Strokes {
			strokeNum := sIdx + 1
			stroke := models.CharacterStroke{
				CharacterID:  targetID,
				StrokeNumber: strokeNum,
				StrokeOrder:  strokeNum,
				PathData:     pathData,
				SvgPath:      pathData,
			}
			if err := db.Create(&stroke).Error; err != nil {
				log.Printf("⚠️ Gagal seeding Stroke %d untuk #%d %s: %v", strokeNum, targetID, item.Symbol, err)
			}
		}

		seededCount++
	}

	// Delete any character ID > len(items)
	db.Where("`id` > ?", len(items)).Delete(&models.Character{})

	log.Printf("✅ Seeding Hiragana berhasil (%d/%d karakter siap).", seededCount, len(items))
	return nil
}

// AutoMigrateAndSeed runs AutoMigrate and SeedHiraganaDataset sequentially.
func AutoMigrateAndSeed(db *gorm.DB) error {
	if err := AutoMigrate(db); err != nil {
		return err
	}
	return SeedHiraganaDataset(db)
}