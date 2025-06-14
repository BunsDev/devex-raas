package fs

import (
	"os"
	"path/filepath"
)

func FetchDir(basePath, relativePath string) ([]os.DirEntry, error) {
	fullPath := filepath.Join(basePath, relativePath)
	return os.ReadDir(fullPath)
}

func FetchFileContent(fullPath string) (string, error) {
	bytes, err := os.ReadFile(fullPath)
	return string(bytes), err
}

func SaveFile(fullPath, content string) error {
	return os.WriteFile(fullPath, []byte(content), 0644)
}
