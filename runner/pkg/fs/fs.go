package fs

import (
	"os"
	"path/filepath"

	"github.com/sergi/go-diff/diffmatchpatch"
)

func FetchDir(basePath, relativePath string) ([]DirEntry, error) {
	fullPath := filepath.Join(basePath, relativePath)
	entries, err := os.ReadDir(fullPath)
	if err != nil {
		return nil, err
	}

	var result []DirEntry
	for _, entry := range entries {
		result = append(result, DirEntry{
			Name:  entry.Name(),
			IsDir: entry.IsDir(),
		})
	}
	return result, nil
}

func FetchFileContent(fullPath string) (string, error) {
	bytes, err := os.ReadFile(fullPath)
	return string(bytes), err
}

func SaveFileDiffs(fullPath, patch string) error {
	currentBytes, err := os.ReadFile(fullPath)
	if err != nil {
		return err
	}

	currentText := string(currentBytes)
	dmp := diffmatchpatch.New()
	patches, err := dmp.PatchFromText(patch)
	if err != nil {
		return err
	}
	newText, results := dmp.PatchApply(patches, currentText)

	for _, result := range results {
		if !result {
			return err
		}
	}

	if err := os.WriteFile(fullPath, []byte(newText), 0644); err != nil {
		return err
	}

	return nil

}
