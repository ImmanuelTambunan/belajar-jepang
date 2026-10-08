package models

import "time"

// Character represents a Japanese character (Hiragana, Katakana, or Kanji).
type Character struct {
	ID           uint               `gorm:"primaryKey;autoIncrement" json:"id"`
	Symbol       string             `gorm:"size:10;not null;column:symbol" json:"symbol"`
	Character    string             `gorm:"size:10;not null;column:character" json:"character"` // backwards compatibility
	ScriptType   string             `gorm:"size:20;not null;column:script_type" json:"script_type"` // hiragana, katakana, kanji
	Type         string             `gorm:"size:20;not null;column:type" json:"type"` // backwards compatibility
	RowGroup     string             `gorm:"size:20;not null;column:row_group" json:"row_group"` // vowel, ka, sa, etc.
	StrokeCount  int                `gorm:"not null;column:stroke_count" json:"stroke_count"`
	StrokesCount int                `gorm:"not null;column:strokes_count" json:"strokes_count"` // backwards compatibility
	JlptLevel    *string            `gorm:"size:5;column:jlpt_level" json:"jlpt_level"`
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
	CharacterID uint      `gorm:"index;not null;column:character_id" json:"character_id"`
	Romaji      string    `gorm:"size:50;not null;column:romaji" json:"romaji"`
	Onyomi      *string   `gorm:"size:100;column:onyomi" json:"onyomi"`
	Kunyomi     *string   `gorm:"size:100;column:kunyomi" json:"kunyomi"`
	Meaning     *string   `gorm:"size:255;column:meaning" json:"meaning"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (CharacterReading) TableName() string {
	return "character_readings"
}

// CharacterStroke represents a stroke's order and its SVG path data.
type CharacterStroke struct {
	ID           uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	CharacterID  uint      `gorm:"index;not null;column:character_id" json:"character_id"`
	StrokeNumber int       `gorm:"not null;column:stroke_number" json:"stroke_number"`
	StrokeOrder  int       `gorm:"not null;column:stroke_order" json:"stroke_order"` // backwards compatibility
	PathData     string    `gorm:"type:text;not null;column:path_data" json:"path_data"`
	SvgPath      string    `gorm:"type:text;not null;column:svg_path" json:"svg_path"` // backwards compatibility
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (CharacterStroke) TableName() string {
	return "character_strokes"
}
