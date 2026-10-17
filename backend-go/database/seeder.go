package database

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	"belajar-jepang-api/models"
	"gorm.io/gorm"
)

// KanaItem represents the raw JSON item from hiragana_107.json or katakana_107.json.
type KanaItem struct {
	Symbol      string   `json:"symbol"`
	ScriptType  string   `json:"script_type"`
	Category    string   `json:"category"`
	RowGroup    string   `json:"row_group"`
	StrokeCount int      `json:"stroke_count"`
	Reading     string   `json:"reading"`
	Strokes     []string `json:"strokes"`
}

// HiraganaItem is an alias for backwards compatibility.
type HiraganaItem = KanaItem

// AutoMigrate runs GORM AutoMigrate for all models.
func AutoMigrate(db *gorm.DB) error {
	log.Println("🔄 Menjalankan GORM AutoMigrate...")
	err := db.AutoMigrate(
		&models.Character{},
		&models.CharacterReading{},
		&models.CharacterStroke{},
		&models.UserCharacterProgress{},
		&models.ExamResult{},
		&models.Kanji{},
	)
	if err != nil {
		return fmt.Errorf("gagal migrasi: %w", err)
	}
	log.Println("✅ AutoMigrate berhasil.")
	return nil
}

// loadDatasetFile attempts multiple path variations to locate dataset JSON files.
func loadDatasetFile(filename string) ([]byte, string, error) {
	pathsToTry := []string{
		"backend-go/data/" + filename,
		"backend/data/" + filename,
		"data/" + filename,
		"../backend-go/data/" + filename,
		"../backend/data/" + filename,
		"../data/" + filename,
		"../../backend-go/data/" + filename,
		"../../data/" + filename,
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
		return nil, "", fmt.Errorf("gagal membaca file dataset %s (terakhir mencoba %v): %w", filename, pathsToTry, readErr)
	}
	return rawData, foundPath, nil
}

// SeedHiraganaDataset reads dataset and seeds Hiragana characters (Gojuon, Dakuon, Handakuon, Yoon) with IDs 1..107.
func SeedHiraganaDataset(db *gorm.DB) error {
	log.Println("🌱 Memulai Seeder: Membaca dataset Hiragana...")

	// Ensure binary collation so Japanese dakuten / handakuten / yoon are treated distinctly
	db.Exec("ALTER TABLE `characters` MODIFY `symbol` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL")
	db.Exec("ALTER TABLE `characters` MODIFY `character` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL")

	rawData, foundPath, err := loadDatasetFile("hiragana_107.json")
	if err != nil {
		// Fallback try hiragana_46.json if 107 is missing
		rawData, foundPath, err = loadDatasetFile("hiragana_46.json")
		if err != nil {
			return err
		}
	}

	log.Printf("📂 Memuat dataset Hiragana dari %s (%d bytes)", foundPath, len(rawData))

	var items []KanaItem
	if err := json.Unmarshal(rawData, &items); err != nil {
		return fmt.Errorf("gagal parsing JSON dataset Hiragana: %w", err)
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
			ScriptType:   "hiragana",
			Type:         "hiragana",
			Category:     category,
			RowGroup:     item.RowGroup,
			StrokeCount:  item.StrokeCount,
			StrokesCount: item.StrokeCount,
			JlptLevel:    &jlptDefault,
		}

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

	log.Printf("✅ Seeding Hiragana berhasil (%d/%d karakter siap).", seededCount, len(items))
	return nil
}

// SeedKatakanaDataset reads dataset and seeds Katakana characters (Gojuon, Dakuon, Handakuon, Yoon) with IDs 108..214.
func SeedKatakanaDataset(db *gorm.DB) error {
	log.Println("🌱 Memulai Seeder: Membaca dataset Katakana...")

	rawData, foundPath, err := loadDatasetFile("katakana_107.json")
	if err != nil {
		return err
	}

	log.Printf("📂 Memuat dataset Katakana dari %s (%d bytes)", foundPath, len(rawData))

	var items []KanaItem
	if err := json.Unmarshal(rawData, &items); err != nil {
		return fmt.Errorf("gagal parsing JSON dataset Katakana: %w", err)
	}

	jlptDefault := "N5"
	seededCount := 0

	for idx, item := range items {
		targetID := uint(107 + idx + 1) // IDs 108 to 214
		category := item.Category
		if category == "" {
			category = "gojuon"
		}

		char := models.Character{
			ID:           targetID,
			Symbol:       item.Symbol,
			Character:    item.Symbol,
			ScriptType:   "katakana",
			Type:         "katakana",
			Category:     category,
			RowGroup:     item.RowGroup,
			StrokeCount:  item.StrokeCount,
			StrokesCount: item.StrokeCount,
			JlptLevel:    &jlptDefault,
		}

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
		readingMeaning := fmt.Sprintf("Karakter Katakana %s (%s)", item.Symbol, item.Reading)
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

	log.Printf("✅ Seeding Katakana berhasil (%d/%d karakter siap).", seededCount, len(items))
	return nil
}

// RawKanjiItem represents the raw JSON item from kanji_n5_batch1.json.
type RawKanjiItem struct {
	ID          uint                 `json:"id"`
	Character   string               `json:"character"`
	JlptLevel   string               `json:"jlpt_level"`
	StrokeCount int                  `json:"stroke_count"`
	Onyomi      string               `json:"onyomi"`
	Kunyomi     string               `json:"kunyomi"`
	MeaningID   string               `json:"meaning_id"`
	MeaningEN   string               `json:"meaning_en"`
	Category    string               `json:"category"`
	Strokes     []string             `json:"strokes"`
	SvgStrokes  string               `json:"svg_strokes"`
	Examples    []models.KanjiExample `json:"examples"`
}

// SeedKanjiDataset reads dataset and seeds all 103 JLPT N5 Kanji (100% Complete).
func SeedKanjiDataset(db *gorm.DB) error {
	log.Println("🌱 Memulai Seeder: Membaca dataset 103 Kanji JLPT N5 (100% Complete)...")

	// Ensure binary collation so Japanese kanji symbols are treated with exact precision
	db.Exec("ALTER TABLE `kanjis` MODIFY `character` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL")

	rawData, foundPath, err := loadDatasetFile("kanji_n5_batch1.json")
	if err != nil {
		return err
	}

	log.Printf("📂 Memuat dataset Kanji dari %s (%d bytes)", foundPath, len(rawData))

	var items []RawKanjiItem
	if err := json.Unmarshal(rawData, &items); err != nil {
		return fmt.Errorf("gagal parsing JSON dataset Kanji: %w", err)
	}

	seededCount := 0
	for _, item := range items {
		examplesJSON, _ := json.Marshal(item.Examples)
		svgStrokes := item.SvgStrokes
		if svgStrokes == "" && len(item.Strokes) > 0 {
			rawSvg, _ := json.Marshal(item.Strokes)
			svgStrokes = string(rawSvg)
		}

		kanji := models.Kanji{
			ID:          item.ID,
			Character:   item.Character,
			JlptLevel:   item.JlptLevel,
			StrokeCount: item.StrokeCount,
			Onyomi:      item.Onyomi,
			Kunyomi:     item.Kunyomi,
			MeaningID:   item.MeaningID,
			MeaningEN:   item.MeaningEN,
			Category:    item.Category,
			SvgStrokes:  svgStrokes,
			Examples:    string(examplesJSON),
		}

		if err := db.Where("`id` = ? OR `character` = ?", item.ID, item.Character).
			Assign(kanji).
			FirstOrCreate(&kanji).Error; err != nil {
			log.Printf("⚠️ Gagal seeding Kanji #%d %s: %v", item.ID, item.Character, err)
			continue
		}
		seededCount++
	}

	log.Printf("✅ Seeding Kanji JLPT N5 berhasil (%d/%d kanji siap).", seededCount, len(items))
	return nil
}

// AutoMigrateAndSeed runs AutoMigrate, SeedHiraganaDataset, SeedKatakanaDataset, and SeedKanjiDataset sequentially.
func AutoMigrateAndSeed(db *gorm.DB) error {
	if err := AutoMigrate(db); err != nil {
		return err
	}
	if err := SeedHiraganaDataset(db); err != nil {
		return err
	}
	if err := SeedKatakanaDataset(db); err != nil {
		return err
	}
	if err := SeedKanjiDataset(db); err != nil {
		return err
	}
	// Clean obsolete character IDs > 214
	db.Where("`id` > ?", 214).Delete(&models.Character{})
	return nil
}