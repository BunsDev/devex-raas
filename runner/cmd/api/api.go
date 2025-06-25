package api

import (
	"fmt"
	"log"
	"net/http"

	"github.com/parthkapoor-dev/runner/pkg/dotenv"
	"github.com/parthkapoor-dev/runner/pkg/json"
	"github.com/parthkapoor-dev/runner/pkg/shutdown"
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
	sm := shutdown.NewShutdownManager(dotenv.EnvString("REPL_ID", ""), shutdownCallback)

	router.Handle("/api/v1/repl/", http.StripPrefix("/api/v1/repl", repl.NewHandler(sm)))
	router.HandleFunc("/test", func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("testing")
		json.WriteJSON(w, http.StatusOK, "we are getting successful")
	})

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
