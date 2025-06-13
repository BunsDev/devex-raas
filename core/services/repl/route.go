package repl

import (
	"log"
	"net/http"

	"github.com/parthkapoor-dev/core/internal/s3"
	"github.com/parthkapoor-dev/core/pkg/json"
)

type Repl struct {
	name     string
	template string
}

func NewHandler(s3Client *s3.S3Client) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("POST /new", func(w http.ResponseWriter, r *http.Request) {
		newRepl(w, r, s3Client)
	})
	return mux
}

func newRepl(w http.ResponseWriter, r *http.Request, s3Client *s3.S3Client) {
	log.Println("POST /repl/new")

	var repl *Repl
	if err := json.ReadJSON(r, &repl); err != nil {
		json.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := s3Client.CopyFolder("templates/node-js/", "repl/base0/"); err != nil {
		log.Fatal("S3 CopyTemplate is giving Err: ", err)
		json.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	json.WriteJSON(w, http.StatusOK, "Success")

}
