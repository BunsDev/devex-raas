package api

import (
	"log"
	"net/http"

	"github.com/parthkapoor-dev/core/internal/s3"
	"github.com/parthkapoor-dev/core/services/auth/github"
	"github.com/parthkapoor-dev/core/services/repl"
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
	s3Client := s3.NewS3Client()

	// Github Auth Routes
	router.Handle("/auth/github/", http.StripPrefix("/auth/github", github.NewHandler()))

	// Protected Repl Routes
	router.Handle("/api/v1/repl/", AuthMiddleware(
		http.StripPrefix("/api/v1/repl", repl.NewHandler(s3Client))))

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"}, // TODO: Update to frontend URL in prod
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
