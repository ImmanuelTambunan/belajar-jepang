package models

import "time"

// KanjiExample represents a vocabulary/jukugo example for a Kanji.
type KanjiExample struct {
	Word      string `json:"word"`
	Reading   string `json:"reading"`
	MeaningID string `json:"meaning_id"`
	MeaningEN string `json:"meaning_en"`
}

// Kanji represents a Japanese Kanji character (e.g., JLPT N5).
type Kanji struct {
	ID          uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	Character   string         `gorm:"size:20;collate:utf8mb4_bin;not null;uniqueIndex;column:character" json:"character"`
	JlptLevel   string         `gorm:"size:10;not null;default:'N5';column:jlpt_level" json:"jlpt_level"`
	StrokeCount int            `gorm:"not null;column:stroke_count" json:"stroke_count"`
	Onyomi      string         `gorm:"size:255;not null;column:onyomi" json:"onyomi"`
	Kunyomi     string         `gorm:"size:255;not null;column:kunyomi" json:"kunyomi"`
	MeaningID   string         `gorm:"size:255;not null;column:meaning_id" json:"meaning_id"`
	MeaningEN   string         `gorm:"size:255;not null;column:meaning_en" json:"meaning_en"`
	Category    string         `gorm:"size:50;not null;column:category" json:"category"`
	SvgStrokes  string         `gorm:"type:longtext;not null;column:svg_strokes" json:"svg_strokes"`
	Examples    string         `gorm:"type:text;column:examples" json:"-"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`

	// Virtual fields populated during API JSON response
	Strokes      []string       `gorm:"-" json:"strokes,omitempty"`
	ExamplesList []KanjiExample `gorm:"-" json:"examples,omitempty"`
}

func (Kanji) TableName() string {
	return "kanjis"
}
