package main

import (
	"log"

	"github.com/parthkapoor-dev/core/cmd/api"
	"github.com/parthkapoor-dev/core/pkg/dotenv"
)

func main() {

	port := dotenv.EnvString("PORT", "8080")
	server := api.NewAPIServer(":" + port)

	if err := server.Run(); err != nil {
		log.Println(err)
	}
}
