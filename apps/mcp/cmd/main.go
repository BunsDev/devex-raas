package main

import (
	"log"

	"mcp/cmd/server"
)

func main() {
	if err := server.NewMcpServer().Run(); err != nil {
		log.Println(err)
	}
	log.Println("Bye!")
}
