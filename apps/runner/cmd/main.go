package main

import (
	"log"

	"runner/cmd/api"
)

func main() {
	server := api.NewAPIServer(":8081")
	if err := server.Run(); err != nil {
		log.Println("Unable to run server")
	}
}
