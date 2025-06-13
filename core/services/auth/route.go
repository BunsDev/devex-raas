package auth

import (
	"log"
	"net/http"
)

func NewHandler() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /login", loginHandler)

	return mux
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Login Handler")
}
