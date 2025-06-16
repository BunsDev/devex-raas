package repl

import (
	"encoding/json"
	"log"

	"github.com/parthkapoor-dev/runner/pkg/ws"
)

// Request/Response structures for typed handlers
type FetchDirRequest struct {
	Dir string `json:"dir"`
}

type FetchContentRequest struct {
	Path string `json:"path"`
}

type UpdateContentRequest struct {
	Path  string `json:"path"`
	Patch string `json:"patch"`
}

type TerminalDataRequest struct {
	Data string `json:"data"`
}

type TerminalResponse struct {
	Data []byte `json:"data"`
}

// EmitTyped sends a strongly-typed message
func EmitTyped[T any](ws *ws.WSHandler, event string, data T) error {
	return ws.Emit(event, data)
}

// OnTyped registers a strongly-typed event handler
func OnTyped[T any](ws *ws.WSHandler, event string, handler func(T)) {
	ws.On(event, func(data any) {
		// Type assertion and conversion
		if jsonData, err := json.Marshal(data); err == nil {
			var typedData T
			if err := json.Unmarshal(jsonData, &typedData); err == nil {
				handler(typedData)
			} else {
				log.Printf("Failed to unmarshal data for event %s: %v", event, err)
			}
		}
	})
}
