package dotenv

import (
	"os"
	"strings"
	"syscall"
)

func EnvString(key, fallback string) string {
	// Check for environment variable first
	if value, ok := syscall.Getenv(key); ok && strings.TrimSpace(value) != "" {
		return value
	}

	// If not found, check Docker secret file at /run/secrets/<key>
	secretPath := "/run/secrets/" + key
	if data, err := os.ReadFile(secretPath); err == nil {
		return strings.TrimSpace(string(data))
	}

	// If nothing found, return fallback
	return fallback
}
