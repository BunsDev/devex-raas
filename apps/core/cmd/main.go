package main

import (
	"log"

	"core/cmd/api"
	"core/pkg/dotenv"
)

func main() {

	port := dotenv.EnvString("PORT", "8080")
	server := api.NewAPIServer(":" + port)

	if err := server.Run(); err != nil {
		log.Println(err)
	}
}
