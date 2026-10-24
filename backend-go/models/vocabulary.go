package models

import "time"

// Vocabulary represents a practical workplace Japanese vocabulary (Shigoto Nihongo & Jukugo Industri).
type Vocabulary struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Word      string    `gorm:"size:50;collate:utf8mb4_bin;not null;column:word" json:"word"`
	Reading   string    `gorm:"size:100;collate:utf8mb4_bin;not null;column:reading" json:"reading"`
	Romaji    string    `gorm:"size:100;not null;column:romaji" json:"romaji"`
	MeaningID string    `gorm:"size:255;not null;column:meaning_id" json:"meaning_id"`
	MeaningEN string    `gorm:"size:255;not null;column:meaning_en" json:"meaning_en"`
	Category  string    `gorm:"size:100;not null;column:category" json:"category"`
	JlptLevel string    `gorm:"size:10;not null;default:'N5';column:jlpt_level" json:"jlpt_level"`
	ExampleJP string    `gorm:"size:255;not null;column:example_jp" json:"example_jp"`
	ExampleID string    `gorm:"size:255;not null;column:example_id" json:"example_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (Vocabulary) TableName() string {
	return "vocabularies"
}