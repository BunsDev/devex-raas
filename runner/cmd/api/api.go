package api

import (
	"fmt"
	"log"
	"net/http"

	"runner/cmd/proxy"
	"runner/pkg/dotenv"
	"runner/pkg/json"
	"runner/pkg/shutdown"
	"runner/services/repl"

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
	sm := shutdown.NewShutdownManager(dotenv.EnvString("REPL_ID", "repl_id_not_found"), shutdownCallback)

	// background repl services
	router.Handle("/api/v1/repl/", http.StripPrefix("/api/v1/repl", repl.NewHandler(sm)))

	// user app usage
	router.HandleFunc("/user-app/", proxy.ReverseProxyHandler)

	router.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("ping-pong")
		json.WriteJSON(w, http.StatusOK, "pong")
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
