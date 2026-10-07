package database

import (
	"log"

	"belajar-jepang-api/models"
	"gorm.io/gorm"
)

// VowelSeedData holds character seed configuration.
type VowelSeedData struct {
	Character    string
	Type         string
	StrokesCount int
	JlptLevel    string
	Reading      models.CharacterReading
	Strokes      []models.CharacterStroke
}

func stringPtr(s string) *string {
	return &s
}

// AutoMigrateAndSeed runs GORM AutoMigrate and seeds Hiragana vowel characters if empty.
func AutoMigrateAndSeed(db *gorm.DB) error {
	log.Println("🔄 Menjalankan GORM AutoMigrate...")
	err := db.AutoMigrate(
		&models.Character{},
		&models.CharacterReading{},
		&models.CharacterStroke{},
	)
	if err != nil {
		return err
	}
	log.Println("✅ AutoMigrate berhasil.")

	// Check if Hiragana vowels are already seeded
	var count int64
	db.Model(&models.Character{}).Where("type = ?", "hiragana").Count(&count)
	if count > 0 {
		log.Printf("ℹ️ Karakter Hiragana sudah tersedia (%d karakter). Melewati seeding.", count)
		return nil
	}

	log.Println("🌱 Memulai Seeder: Menyisipkan karakter vokal Hiragana (あ, い, う, え, お)...")

	vowels := []VowelSeedData{
		{
			Character:    "あ",
			Type:         "hiragana",
			StrokesCount: 3,
			JlptLevel:    "N5",
			Reading: models.CharacterReading{
				Romaji:  "a",
				Meaning: stringPtr("Huruf vokal Hiragana A"),
			},
			Strokes: []models.CharacterStroke{
				{
					StrokeOrder: 1,
					SvgPath:     "M31.01,33c0.88,0.88,2.75,1.82,5.25,1.75c8.62-0.25,20-2.12,29.5-4.25c1.51-0.34,4.62-0.88,6.62-0.5",
				},
				{
					StrokeOrder: 2,
					SvgPath:     "M49.76,17.62c0.88,1,1.82,3.26,1.38,5.25c-3.75,16.75-6.25,38.13-5.13,53.63c0.41,5.7,1.88,10.88,3.38,13.62",
				},
				{
					StrokeOrder: 3,
					SvgPath:     "M65.63,44.12c0.75,1.12,1.16,4.39,0.5,6.12c-4.62,12.26-11.24,23.76-25.37,35.76c-6.86,5.83-15.88,3.75-16.25-8.38c-0.34-10.87,13.38-23.12,32.38-26.74c12.42-2.37,27,1.38,30.5,12.75c4.05,13.18-3.76,26.37-20.88,30.49",
				},
			},
		},
		{
			Character:    "い",
			Type:         "hiragana",
			StrokesCount: 2,
			JlptLevel:    "N5",
			Reading: models.CharacterReading{
				Romaji:  "i",
				Meaning: stringPtr("Huruf vokal Hiragana I"),
			},
			Strokes: []models.CharacterStroke{
				{
					StrokeOrder: 1,
					SvgPath:     "M21.5,29.66c2.01,2.17,2.61,4.68,2.17,7.43c-3.09,19.16-1.03,32.01,7.93,41.45c6.12,6.45,6.26,3.14,7.04-5.21",
				},
				{
					StrokeOrder: 2,
					SvgPath:     "M72.96,36.51c9.44,8.05,17.79,18.82,18.41,33.83",
				},
			},
		},
		{
			Character:    "う",
			Type:         "hiragana",
			StrokesCount: 2,
			JlptLevel:    "N5",
			Reading: models.CharacterReading{
				Romaji:  "u",
				Meaning: stringPtr("Huruf vokal Hiragana U"),
			},
			Strokes: []models.CharacterStroke{
				{
					StrokeOrder: 1,
					SvgPath:     "M42,15.5c5.62,2.12,9.62,3,12.88,3c8.27,0,8,1.12-0.38,5.5",
				},
				{
					StrokeOrder: 2,
					SvgPath:     "M33,42.38c2.12,1.12,4.12,2.88,8.5,1.38c4.38-1.5,12.75-7.12,18.5-7c5.75,0.12,10.25,5,10.25,18c0,15.49-8.25,30.24-24.37,41.24",
				},
			},
		},
		{
			Character:    "え",
			Type:         "hiragana",
			StrokesCount: 2,
			JlptLevel:    "N5",
			Reading: models.CharacterReading{
				Romaji:  "e",
				Meaning: stringPtr("Huruf vokal Hiragana E"),
			},
			Strokes: []models.CharacterStroke{
				{
					StrokeOrder: 1,
					SvgPath:     "M40.52,13.25c5.62,2.12,10,3,14.12,3c8.27,0,8,1.12-0.38,5.5",
				},
				{
					StrokeOrder: 2,
					SvgPath:     "M32.52,45.12c1.88,1.25,4.5,1.75,7.38,0.62c3.29-1.29,17-7.88,21.25-9.88c4.25-2,8.32,0.04,4.38,4.62c-12.26,14.27-27.26,31.52-39.51,44.4c-3.26,3.42-0.58,3.54,1.5,1.37c13.5-14.12,18.12-20.12,23.62-20.12c7.13,0,3.5,16.75,6.75,22.38c3.25,5.63,19.12,3.75,26.12,2.12",
				},
			},
		},
		{
			Character:    "お",
			Type:         "hiragana",
			StrokesCount: 3,
			JlptLevel:    "N5",
			Reading: models.CharacterReading{
				Romaji:  "o",
				Meaning: stringPtr("Huruf vokal Hiragana O"),
			},
			Strokes: []models.CharacterStroke{
				{
					StrokeOrder: 1,
					SvgPath:     "M22.88,35.12c1.38,1,3.62,2.38,6,2.12c2.38-0.26,19.62-5.12,21.12-5.74c1.5-0.62,4-1.25,5.88-2",
				},
				{
					StrokeOrder: 2,
					SvgPath:     "M41.5,16.12c2.25,1,3.59,4.39,3.12,7.38c-2.5,16.12-3.37,45.53-2.25,58.38c0.75,8.62-0.64,10.45-7.12,7.12c-5.13-2.62-13.75-8-13.75-12.38c0-7.5,24.38-23.62,44.75-23.62c17.25,0,25,8.25,25,17.25c0,8.25-9.38,18.88-26.75,21",
				},
				{
					StrokeOrder: 3,
					SvgPath:     "M73,22.12c5.38,2.62,8.88,5.88,10.62,8.25c2.27,3.08,0.38,4.5-1.12,5",
				},
			},
		},
	}

	for _, v := range vowels {
		char := models.Character{
			Character:    v.Character,
			Type:         v.Type,
			StrokesCount: v.StrokesCount,
			JlptLevel:    &v.JlptLevel,
		}

		if err := db.Create(&char).Error; err != nil {
			log.Printf("⚠️ Gagal menyisipkan karakter %s: %v", v.Character, err)
			continue
		}

		v.Reading.CharacterID = char.ID
		if err := db.Create(&v.Reading).Error; err != nil {
			log.Printf("⚠️ Gagal menyisipkan reading untuk %s: %v", v.Character, err)
		}

		for _, st := range v.Strokes {
			st.CharacterID = char.ID
			if err := db.Create(&st).Error; err != nil {
				log.Printf("⚠️ Gagal menyisipkan stroke %d untuk %s: %v", st.StrokeOrder, v.Character, err)
			}
		}
	}

	log.Println("✅ Seeding Hiragana Vokal berhasil (5 karakter).")
	return nil
}
