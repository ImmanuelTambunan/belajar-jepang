package database_test

import (
	"encoding/json"
	"os"
	"testing"

	"belajar-jepang-api/database"
)

func TestHiraganaDatasetIntegrity(t *testing.T) {
	paths := []string{
		"../data/hiragana_46.json",
		"../../backend/data/hiragana_46.json",
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
		t.Fatalf("Failed to read hiragana_46.json: %v", err)
	}

	var items []database.HiraganaItem
	if err := json.Unmarshal(data, &items); err != nil {
		t.Fatalf("Failed to unmarshal hiragana_46.json: %v", err)
	}

	if len(items) != 46 {
		t.Fatalf("Expected 46 characters, got %d", len(items))
	}

	validGroups := map[string]bool{
		"vowel": true, "ka": true, "sa": true, "ta": true,
		"na": true, "ha": true, "ma": true, "ya": true,
		"ra": true, "wa": true, "n": true,
	}

	groupCounts := make(map[string]int)

	for i, item := range items {
		if item.Symbol == "" {
			t.Errorf("Item %d has empty symbol", i)
		}
		if item.ScriptType != "hiragana" {
			t.Errorf("Item %d (%s) expected script_type 'hiragana', got %q", i, item.Symbol, item.ScriptType)
		}
		if !validGroups[item.RowGroup] {
			t.Errorf("Item %d (%s) invalid row_group %q", i, item.Symbol, item.RowGroup)
		}
		groupCounts[item.RowGroup]++

		if item.StrokeCount != len(item.Strokes) {
			t.Errorf("Item %d (%s) stroke_count (%d) != len(strokes) (%d)", i, item.Symbol, item.StrokeCount, len(item.Strokes))
		}
		if item.Reading == "" {
			t.Errorf("Item %d (%s) has empty reading", i, item.Symbol)
		}
		for sIdx, stroke := range item.Strokes {
			if len(stroke) == 0 {
				t.Errorf("Item %d (%s) stroke %d is empty", i, item.Symbol, sIdx+1)
			}
		}
	}

	expectedCounts := map[string]int{
		"vowel": 5, "ka": 5, "sa": 5, "ta": 5,
		"na": 5, "ha": 5, "ma": 5, "ya": 3,
		"ra": 5, "wa": 2, "n": 1,
	}

	for group, expected := range expectedCounts {
		if actual := groupCounts[group]; actual != expected {
			t.Errorf("Group %q expected %d items, got %d", group, expected, actual)
		}
	}
}
