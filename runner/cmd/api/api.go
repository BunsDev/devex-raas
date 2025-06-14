package api

import (
	"log"
	"net/http"

	"github.com/parthkapoor-dev/runner/services/repl"
	"github.com/rs/cors"
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

	router.Handle("/api/v1/repl/", http.StripPrefix("/api/v1/repl", repl.NewHandler()))

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"}, // TODO: Update to frontend URL in prod
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})
	server := http.Server{
		Addr:    api.addr,
		Handler: c.Handler(router),
	}

	log.Println("Server has started at ", api.addr)
	return server.ListenAndServe()
}
