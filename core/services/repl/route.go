package repl

import (
	"log"
	"net/http"
)

func NewHandler() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("POST /new", newRepl)

	return mux
}

func newRepl(w http.ResponseWriter, r *http.Request) {
	log.Println("new repl")
}
