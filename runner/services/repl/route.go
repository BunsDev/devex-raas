package repl

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/parthkapoor-dev/runner/pkg/fs"
	"github.com/parthkapoor-dev/runner/pkg/pty"
	"github.com/parthkapoor-dev/runner/pkg/ws"
)

func NewHandler() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		ws := ws.NewWSHandler()

		pty := pty.NewPTYManager()
		defer pty.Cleanup()

		handleWs(w, r, ws, pty)
	})
	return mux
}

func generateSessionID() string {
	bytes := make([]byte, 8)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

func handleWs(w http.ResponseWriter, r *http.Request, ws *ws.WSHandler, pty *pty.PTYManager) {

	if err := ws.Init(w, r); err != nil {
		log.Println(err)
	}

	host := r.Host
	replId := strings.Split(host, ".")[0]
	if replId == "" {
		log.Println("No repl ID found, closing connection")
		return
	}

	ws.On("Connection", func(data any) {
		log.Println("we go connected")
		rootContents, _ := fs.FetchDir("/workspaces", "")
		ws.Emit("Loaded", map[string]any{
			"rootContents": rootContents,
		})
	})

	OnTyped(ws, "fetchDir", func(req FetchDirRequest) {

		contents, err := fs.FetchDir("/workspaces", req.Dir)
		if err != nil {
			log.Printf("Error fetching directory: %v", err)
			ws.Emit("fetchDirResponse", map[string]any{
				"error": err.Error(),
			})
			return
		}

		// Send response back to client
		ws.Emit("fetchDirResponse", map[string]any{
			"contents": contents,
			"path":     req.Dir,
		})
	})

	// Handle fetchContent event
	OnTyped(ws, "fetchContent", func(req FetchContentRequest) {
		fullPath := fmt.Sprintf("/workspaces/%s", req.Path)
		data, err := fs.FetchFileContent(fullPath)
		if err != nil {
			log.Printf("Error fetching file content: %v", err)
			ws.Emit("fetchContentResponse", map[string]any{
				"error": err.Error(),
			})
			return
		}

		// Send response back to client
		ws.Emit("fetchContentResponse", map[string]string{
			"content": data,
			"path":    req.Path,
		})
	})

	// Handle updateContent event
	OnTyped(ws, "updateContent", func(req UpdateContentRequest) {
		fullPath := fmt.Sprintf("/workspaces/%s", req.Path)

		// Save file locally
		err := fs.SaveFileDiffs(fullPath, req.Patch)
		if err != nil {
			log.Printf("Error saving file: %v", err)
			ws.Emit("updateContentResponse", map[string]any{
				"error": err.Error(),
			})
			return
		}

		ws.Emit("updateContentResponse", map[string]any{
			"success": true,
		})
	})

	var sessionId string

	// Handle requestTerminal event
	ws.On("requestTerminal", func(data any) {
		sessionId = generateSessionID()
		session, err := pty.CreateSession(sessionId, nil)
		if err != nil {
			return
		}
		session.SetOnDataCallback(func(data []byte) {
			ws.Emit("terminalResponse", string(data))
		})
		session.SetOnCloseCallback(func() {
			ws.Emit("terminalClosed", nil)
		})
	})

	// Handle terminalData event
	OnTyped(ws, "terminalInput", func(req TerminalDataRequest) {
		session, exist := pty.GetSession(sessionId)
		if exist == false {
			return
		}
		session.WriteString(req.Data)
	})

}
