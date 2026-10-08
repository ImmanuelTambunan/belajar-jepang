package database

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	"belajar-jepang-api/models"
	"gorm.io/gorm"
)

// HiraganaItem represents the raw JSON item from hiragana_46.json.
type HiraganaItem struct {
	Symbol      string   `json:"symbol"`
	ScriptType  string   `json:"script_type"`
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
	)
	if err != nil {
		return fmt.Errorf("gagal migrasi: %w", err)
	}
	log.Println("✅ AutoMigrate berhasil.")
	return nil
}

// SeedHiraganaDataset reads backend/data/hiragana_46.json and seeds 46 Hiragana characters using db.FirstOrCreate().
func SeedHiraganaDataset(db *gorm.DB) error {
	log.Println("🌱 Memulai Seeder: Membaca dataset 46 karakter Hiragana...")

	// Candidates for data file location
	pathsToTry := []string{
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
		return fmt.Errorf("gagal membaca file hiragana_46.json (terakhir mencoba %v): %w", pathsToTry, readErr)
	}

	log.Printf("📂 Memuat dataset dari %s (%d bytes)", foundPath, len(rawData))

	var items []HiraganaItem
	if err := json.Unmarshal(rawData, &items); err != nil {
		return fmt.Errorf("gagal parsing JSON dataset: %w", err)
	}

	jlptDefault := "N5"
	seededCount := 0

	for _, item := range items {
		// 1. Model Character: simpan symbol, script_type, row_group, dan stroke_count
		char := models.Character{
			Symbol:       item.Symbol,
			Character:    item.Symbol,
			ScriptType:   item.ScriptType,
			Type:         item.ScriptType,
			RowGroup:     item.RowGroup,
			StrokeCount:  item.StrokeCount,
			StrokesCount: item.StrokeCount,
			JlptLevel:    &jlptDefault,
		}

		// FirstOrCreate based on symbol/character
		if err := db.Where("symbol = ? OR character = ?", item.Symbol, item.Symbol).
			Assign(models.Character{
				Symbol:       item.Symbol,
				Character:    item.Symbol,
				ScriptType:   item.ScriptType,
				Type:         item.ScriptType,
				RowGroup:     item.RowGroup,
				StrokeCount:  item.StrokeCount,
				StrokesCount: item.StrokeCount,
				JlptLevel:    &jlptDefault,
			}).
			FirstOrCreate(&char).Error; err != nil {
			log.Printf("⚠️ Gagal seeding Character %s: %v", item.Symbol, err)
			continue
		}

		// 2. Model CharacterReading: relasikan ke CharacterID dengan field romaji
		readingMeaning := fmt.Sprintf("Karakter Hiragana %s (%s)", item.Symbol, item.Reading)
		reading := models.CharacterReading{
			CharacterID: char.ID,
			Romaji:      item.Reading,
			Meaning:     &readingMeaning,
		}

		if err := db.Where("character_id = ? AND romaji = ?", char.ID, item.Reading).
			Assign(models.CharacterReading{
				CharacterID: char.ID,
				Romaji:      item.Reading,
				Meaning:     &readingMeaning,
			}).
			FirstOrCreate(&reading).Error; err != nil {
			log.Printf("⚠️ Gagal seeding Reading untuk %s: %v", item.Symbol, err)
		}

		// 3. Model CharacterStroke: simpan urutan stroke_number (1..n) dan path_data SVG untuk tiap garis
		for idx, pathData := range item.Strokes {
			strokeNum := idx + 1
			stroke := models.CharacterStroke{
				CharacterID:  char.ID,
				StrokeNumber: strokeNum,
				StrokeOrder:  strokeNum,
				PathData:     pathData,
				SvgPath:      pathData,
			}

			if err := db.Where("character_id = ? AND (stroke_number = ? OR stroke_order = ?)", char.ID, strokeNum, strokeNum).
				Assign(models.CharacterStroke{
					CharacterID:  char.ID,
					StrokeNumber: strokeNum,
					StrokeOrder:  strokeNum,
					PathData:     pathData,
					SvgPath:      pathData,
				}).
				FirstOrCreate(&stroke).Error; err != nil {
				log.Printf("⚠️ Gagal seeding Stroke %d untuk %s: %v", strokeNum, item.Symbol, err)
			}
		}

		seededCount++
	}

	log.Printf("✅ Seeding Hiragana 46 Karakter berhasil (%d/%d karakter siap).", seededCount, len(items))
	return nil
}

// AutoMigrateAndSeed runs AutoMigrate and SeedHiraganaDataset sequentially.
func AutoMigrateAndSeed(db *gorm.DB) error {
	if err := AutoMigrate(db); err != nil {
		return err
	}
	return SeedHiraganaDataset(db)
}
