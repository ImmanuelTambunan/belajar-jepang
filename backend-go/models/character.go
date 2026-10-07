package models

import "time"

// Character represents a Japanese character (Hiragana, Katakana, or Kanji).
type Character struct {
	ID           uint               `gorm:"primaryKey;autoIncrement" json:"id"`
	Character    string             `gorm:"size:10;not null" json:"character"`
	Type         string             `gorm:"size:20;not null" json:"type"` // hiragana, katakana, kanji
	StrokesCount int                `gorm:"not null" json:"strokes_count"`
	JlptLevel    *string            `gorm:"size:5" json:"jlpt_level"`
	CreatedAt    time.Time          `json:"created_at"`
	UpdatedAt    time.Time          `json:"updated_at"`
	Readings     []CharacterReading `gorm:"foreignKey:CharacterID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"readings"`
	Strokes      []CharacterStroke  `gorm:"foreignKey:CharacterID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"strokes"`
}

func (Character) TableName() string {
	return "characters"
}

// CharacterReading represents the pronunciation readings and meaning.
type CharacterReading struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	CharacterID uint      `gorm:"index;not null" json:"character_id"`
	Romaji      string    `gorm:"size:50;not null" json:"romaji"`
	Onyomi      *string   `gorm:"size:100" json:"onyomi"`
	Kunyomi     *string   `gorm:"size:100" json:"kunyomi"`
	Meaning     *string   `gorm:"size:255" json:"meaning"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (CharacterReading) TableName() string {
	return "character_readings"
}

// CharacterStroke represents a stroke's order and its SVG path data.
type CharacterStroke struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	CharacterID uint      `gorm:"index;not null" json:"character_id"`
	StrokeOrder int       `gorm:"not null" json:"stroke_order"`
	SvgPath     string    `gorm:"type:text;not null" json:"svg_path"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (CharacterStroke) TableName() string {
	return "character_strokes"
}
