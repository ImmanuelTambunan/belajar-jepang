package database_test

import (
	"encoding/json"
	"os"
	"testing"

	"belajar-jepang-api/database"
)

func verifyKanaDataset(t *testing.T, filename string, expectedScript string) {
	paths := []string{
		"../data/" + filename,
		"backend-go/data/" + filename,
		"data/" + filename,
		"../../backend-go/data/" + filename,
	}

	var data []byte
	var err error
	for _, p := range paths {
		data, err = os.ReadFile(p)
		if err == nil {
			break
		}
	}
	if err != nil {
		t.Fatalf("Failed to read %s: %v", filename, err)
	}

	var items []database.KanaItem
	if err := json.Unmarshal(data, &items); err != nil {
		t.Fatalf("Failed to unmarshal %s: %v", filename, err)
	}

	if len(items) != 107 {
		t.Fatalf("Expected 107 characters in %s, got %d", filename, len(items))
	}

	categoryCounts := make(map[string]int)

	for i, item := range items {
		if item.Symbol == "" {
			t.Errorf("[%s] Item %d has empty symbol", filename, i)
		}
		if item.ScriptType != expectedScript {
			t.Errorf("[%s] Item %d (%s) expected script_type %q, got %q", filename, i, item.Symbol, expectedScript, item.ScriptType)
		}
		if item.Reading == "" {
			t.Errorf("[%s] Item %d (%s) has empty reading", filename, i, item.Symbol)
		}
		if item.StrokeCount != len(item.Strokes) || item.StrokeCount <= 0 {
			t.Errorf("[%s] Item %d (%s) stroke_count (%d) != len(strokes) (%d)", filename, i, item.Symbol, item.StrokeCount, len(item.Strokes))
		}
		for sIdx, stroke := range item.Strokes {
			if len(stroke) == 0 {
				t.Errorf("[%s] Item %d (%s) stroke %d is empty", filename, i, item.Symbol, sIdx+1)
			}
		}
		categoryCounts[item.Category]++
	}

	expectedCategories := map[string]int{
		"gojuon":     46,
		"dakuon":     20,
		"handakuon":  5,
		"yoon":       36,
	}

	for cat, expCount := range expectedCategories {
		if categoryCounts[cat] != expCount {
			t.Errorf("[%s] Expected %d %s characters, got %d", filename, expCount, cat, categoryCounts[cat])
		}
	}
}

func TestHiraganaDatasetIntegrity(t *testing.T) {
	verifyKanaDataset(t, "hiragana_107.json", "hiragana")
}

func TestKatakanaDatasetIntegrity(t *testing.T) {
	verifyKanaDataset(t, "katakana_107.json", "katakana")
}
