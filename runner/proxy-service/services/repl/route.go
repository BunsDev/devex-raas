package repl

import (
	"net/http"

	"github.com/parthkapoor-dev/proxy/internal/s3"
)

func NewHandler(s3Client *s3.S3Client) http.Handler {
	mux := http.NewServeMux()
	// mux.HandleFunc("GET /delete/{userName}/{replId}", deleteRepl)

	return mux
}
