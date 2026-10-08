package models

import "time"

// UserCharacterProgress tracks user's memorization state for a specific character.
type UserCharacterProgress struct {
	ID              uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	CharacterID     uint       `gorm:"uniqueIndex;not null;column:character_id" json:"character_id"`
	Character       *Character `gorm:"foreignKey:CharacterID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"character,omitempty"`
	Status          string     `gorm:"size:20;not null;default:'learning';column:status" json:"status"` // "learning", "memorized"
	ReviewCount     int        `gorm:"not null;default:0;column:review_count" json:"review_count"`
	AccuracyScore   *float64   `gorm:"column:accuracy_score" json:"accuracy_score,omitempty"`
	LastPracticedAt *time.Time `gorm:"column:last_practiced_at" json:"last_practiced_at"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

func (UserCharacterProgress) TableName() string {
	return "user_character_progress"
}
