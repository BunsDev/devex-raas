package main

import (
	"log"

	"runner/cmd/api"
)

func main() {
	if err := api.NewAPIServer(":8081", 50051).Run(); err != nil {
		log.Fatal("Unable to run server")
	}
}
