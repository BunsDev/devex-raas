package api

import (
	"log"
	"net/http"

	"github.com/parthkapoor-dev/core/services/auth"
)

type APIServer struct {
	addr string
}

func NewAPIServer(addr string) *APIServer {
	return &APIServer{
		addr: addr,
	}
}

func (api *APIServer) Run() error {

	router := http.NewServeMux()

	router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		log.Println("Hello world")
	})

	router.Handle("/api/v1/auth/", http.StripPrefix("/api/v1/auth", auth.NewHandler()))

	server := http.Server{
		Addr:    api.addr,
		Handler: router,
	}

	log.Println("Server has started at ", api.addr)

	return server.ListenAndServe()
}
