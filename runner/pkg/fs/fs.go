package fs

import (
	"os"
	"path/filepath"
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

func SaveFile(fullPath, content string) error {
	return os.WriteFile(fullPath, []byte(content), 0644)
}
