package api

import (
	"log"
	"net/http"

	"github.com/parthkapoor-dev/core/cmd/middleware"
	"github.com/parthkapoor-dev/core/internal/redis"
	"github.com/parthkapoor-dev/core/internal/s3"
	"github.com/parthkapoor-dev/core/pkg/dotenv"
	"github.com/parthkapoor-dev/core/pkg/json"
	"github.com/parthkapoor-dev/core/services/auth/github"
	"github.com/parthkapoor-dev/core/services/repl"
	"github.com/parthkapoor-dev/core/services/runner"
	"github.com/rs/cors"
)

var FRONTEND_URL = dotenv.EnvString("FRONTEND_URL", "*")

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
	rds := redis.NewRedisStore()

	// Test Route
	router.HandleFunc("GET /test", func(w http.ResponseWriter, r *http.Request) {
		log.Println("The Protected Route is Accessed")
		json.WriteJSON(w, http.StatusOK, "Success")
	})

	// Github Auth Routes
	router.Handle("/auth/github/", http.StripPrefix("/auth/github", github.NewHandler()))

	// Runner Routes
	router.Handle("/api/runner/", http.StripPrefix("/api/runner", runner.NewHandler(rds)))

	// Protected Repl Routes
	router.Handle("/api/repl/", middleware.AuthMiddleware(
		http.StripPrefix("/api/repl", repl.NewHandler(s3Client, rds))))

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{FRONTEND_URL, "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "DELETE", "OPTIONS"},
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
