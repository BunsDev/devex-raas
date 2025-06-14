package repl

import (
	"log"
	"net/http"

	"github.com/parthkapoor-dev/runner/pkg/ws"
)

func NewHandler() http.Handler {
	mux := http.NewServeMux()
	ws := ws.NewWSHandler()

	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		handleWs(w, r, ws)
	})
	return mux
}

func handleWs(w http.ResponseWriter, r *http.Request, ws *ws.WSHandler) {

	if err := ws.Init(w, r); err != nil {
		log.Fatal(err)
	}

	ws.Emit("loaded", "Babe we are loaded")

}
