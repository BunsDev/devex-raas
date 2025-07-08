package models

// Template configuration
type TemplateConfig struct {
	BaseImage string
	Port      int32
}

var TemplateConfigs = map[string]TemplateConfig{
	"node": {
		BaseImage: "node:20-slim",
		Port:      8081,
	},
	"python": {
		BaseImage: "python:3.11-slim",
		Port:      8081,
	},
	"go": {
		BaseImage: "golang:1.24-alpine",
		Port:      8081,
	},
	// Add more templates as needed
}
