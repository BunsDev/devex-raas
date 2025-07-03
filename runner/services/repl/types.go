package repl

import (
	"encoding/json"
	"log"

	"github.com/parthkapoor-dev/runner/pkg/ws"
)

type FetchDirRequest struct {
	Dir string `json:"Dir"`
}

type FetchContentRequest struct {
	Path string `json:"path"`
}

type UpdateContentRequest struct {
	Path  string `json:"path"`
	Patch string `json:"patch"`
}

type TerminalDataRequest struct {
	Data      string `json:"data"`
	SessionID string `json:"sessionId"`
}

type TerminalResizeRequest struct {
	Cols      int    `json:"cols"`
	Rows      int    `json:"rows"`
	SessionID string `json:"sessionId"`
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
