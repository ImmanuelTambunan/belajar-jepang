package models

import "time"

// ExamResult stores the history of completed quiz and exam sessions.
type ExamResult struct {
	ID                uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	TotalQuestions    int       `gorm:"not null;column:total_questions" json:"total_questions"`
	CorrectAnswers    int       `gorm:"not null;column:correct_answers" json:"correct_answers"`
	Score             int       `gorm:"not null;column:score" json:"score"` // 0 - 100
	DurationSeconds   int       `gorm:"not null;column:duration_seconds" json:"duration_seconds"`
	WrongCharacterIDs string    `gorm:"type:text;column:wrong_character_ids" json:"wrong_character_ids"`
	CreatedAt         time.Time `json:"created_at"`
}

func (ExamResult) TableName() string {
	return "exam_results"
}
