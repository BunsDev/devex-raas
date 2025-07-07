package repl

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

// Ping the Runner Service to check whether the container is running or initiating.
func pingRunner(url string) error {
	timeout := time.After(1 * time.Minute)
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-timeout:
			return fmt.Errorf("timeout: no 'pong' response received from %s", url)

		case <-ticker.C:
			resp, err := http.Get(url)
			if err != nil {
				log.Println("Ping failed:", err)
				continue
			}
			body, err := io.ReadAll(resp.Body)
			resp.Body.Close()
			if err != nil {
				log.Println("Error reading response:", err)
				continue
			}
			if string(body) == "\"pong\"\n" {
				log.Println("Received 'pong' from", url)
				return nil
			} else {
				log.Println("Received unexpected response:", string(body))
			}
		}
	}
}
