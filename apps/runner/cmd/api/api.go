package api

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"packages/utils/json"
	"runner/cmd/proxy"
	"runner/pkg/dotenv"
	"runner/pkg/shutdown"
	"runner/services/mcp"
	"runner/services/repl"

	"github.com/rs/cors"
	"golang.org/x/sync/errgroup"
)

type APIServer struct {
	httpAddr string
	grpcPort int
}

func NewAPIServer(httpAddr string, grpcPort int) *APIServer {
	return &APIServer{
		httpAddr: httpAddr,
		grpcPort: grpcPort,
	}
}

func (api *APIServer) Run() error {

	g, _ := errgroup.WithContext(context.Background())

	g.Go(api.RunGRPC)
	g.Go(api.RunHTTP)

	return g.Wait()
}

func (api *APIServer) RunGRPC() error {

	if err := mcp.NewGrpcServer().Start(api.grpcPort); err != nil {
		return err
	}
	return nil

}

func (api *APIServer) RunHTTP() error {

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
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})
	server := http.Server{
		Addr:    api.httpAddr,
		Handler: c.Handler(router),
	}

	log.Println("Server has started at ", api.httpAddr)
	return server.ListenAndServe()
}
