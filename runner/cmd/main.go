package main

import (
	"log"

	"github.com/parthkapoor-dev/runner/cmd/api"
)

func main() {
	server := api.NewAPIServer(":8081")
	if err := server.Run(); err != nil {
		log.Fatal("Unable to run server")
	}
}
