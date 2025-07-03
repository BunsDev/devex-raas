package repl

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"

	"github.com/parthkapoor-dev/runner/pkg/fs"
	"github.com/parthkapoor-dev/runner/pkg/pty"
	"github.com/parthkapoor-dev/runner/pkg/shutdown"
	"github.com/parthkapoor-dev/runner/pkg/ws"
)

var (
	ptyManager *pty.PTYManager
	once       sync.Once
)

func getPTYManager() *pty.PTYManager {
	once.Do(func() {
		ptyManager = pty.NewPTYManager()
	})
	return ptyManager
}

func NewHandler(sm *shutdown.ShutdownManager) http.Handler {
	mux := http.NewServeMux()
	ptyManager = getPTYManager()

	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		wsHandler := ws.NewWSHandler(strings.Split(r.Host, ".")[0], sm)
		handleWs(w, r, wsHandler, ptyManager)
	})
	return mux
}

func generateSessionID() string {
	bytes := make([]byte, 16)
	_, err := rand.Read(bytes)
	if err != nil {
		return ""
	}
	return hex.EncodeToString(bytes)
}

func handleWs(w http.ResponseWriter, r *http.Request, ws *ws.WSHandler, ptyManager *pty.PTYManager) {

	if err := ws.Init(w, r); err != nil {
		log.Printf("Failed to initialize websocket: %v", err)
		return
	}

	ws.On("Connection", func(data any) {
		rootContents, err := fs.FetchDir("/workspaces", "")
		if err != nil {
			ws.Emit("error", map[string]any{"message": "Failed to load directory"})
			return
		}
		ws.Emit("Loaded", map[string]any{
			"rootContents": rootContents,
		})
	})

	OnTyped(ws, "fetchDir", func(req FetchDirRequest) {
		contents, err := fs.FetchDir("/workspaces", req.Dir)
		if err != nil {
			log.Printf("Error fetching directory: %v", err)
			ws.Emit("fetchDirResponse", map[string]any{"error": err.Error()})
			return
		}
		ws.Emit("fetchDirResponse", map[string]any{"contents": contents, "path": req.Dir})
	})

	OnTyped(ws, "fetchContent", func(req FetchContentRequest) {
		fullPath := fmt.Sprintf("/workspaces/%s", req.Path)
		data, err := fs.FetchFileContent(fullPath)
		if err != nil {
			log.Printf("Error fetching file content: %v", err)
			ws.Emit("fetchContentResponse", map[string]any{"error": err.Error()})
			return
		}
		ws.Emit("fetchContentResponse", map[string]string{"content": data, "path": req.Path})
	})

	OnTyped(ws, "updateContent", func(req UpdateContentRequest) {
		fullPath := fmt.Sprintf("/workspaces/%s", req.Path)
		err := fs.SaveFileDiffs(fullPath, req.Patch)
		if err != nil {
			log.Printf("Error saving file: %v", err)
			ws.Emit("updateContentResponse", map[string]any{"error": err.Error()})
			return
		}
		ws.Emit("updateContentResponse", map[string]any{"success": true})
	})

	ws.On("requestTerminal", func(data any) {
		sessionID := generateSessionID()
		if sessionID == "" {
			ws.Emit("terminalError", map[string]string{"error": "Failed to generate session ID"})
			return
		}

		session, err := ptyManager.CreateSession(sessionID, nil)
		if err != nil {
			ws.Emit("terminalError", map[string]string{"error": "Failed to create terminal session"})
			return
		}

		ws.Emit("terminalConnected", map[string]string{"sessionId": sessionID})

		session.SetOnDataCallback(func(data []byte) {
			ws.Emit("terminalResponse", string(data))
		})

		session.SetOnCloseCallback(func() {
			ws.Emit("terminalClosed", nil)
			ptyManager.RemoveSession(sessionID)
		})
	})

	OnTyped(ws, "terminalInput", func(req TerminalDataRequest) {
		session, exists := ptyManager.GetSession(req.SessionID)
		if !exists {
			return
		}
		session.WriteString(req.Data)
	})

	OnTyped(ws, "terminalResize", func(req TerminalResizeRequest) {
		session, exists := ptyManager.GetSession(req.SessionID)
		if !exists {
			return
		}
		session.Resize(req.Cols, req.Rows)
	})
}
