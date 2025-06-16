package repl

import (
	"fmt"
	"log"
	"net/http"

	"github.com/parthkapoor-dev/core/internal/k8s"
	"github.com/parthkapoor-dev/core/internal/s3"
	"github.com/parthkapoor-dev/core/pkg/json"
)

func NewHandler(s3Client *s3.S3Client) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("POST /new", func(w http.ResponseWriter, r *http.Request) {
		newRepl(w, r, s3Client)
	})
	mux.HandleFunc("GET /start/{userName}/{replId}", startRepl)
	mux.HandleFunc("GET /delete/{userName}/{replId}", deleteRepl)

	return mux
}

func newRepl(w http.ResponseWriter, r *http.Request, s3Client *s3.S3Client) {
	log.Println("POST /repl/new")

	var repl *newReplRequest
	if err := json.ReadJSON(r, &repl); err != nil {
		json.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	userName := repl.UserName
	replID := "repl-235"

	// TODO: Create a new replId
	// TODO: Copy to this path: repl/userName/replId
	destinationPrefix := fmt.Sprintf("repl/%s/%s/", userName, replID)
	if err := s3Client.CopyFolder(repl.Template, destinationPrefix); err != nil {
		log.Fatal("S3 CopyTemplate is giving Err: ", err)
		json.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	json.WriteJSON(w, http.StatusOK, "Success")

}

func startRepl(w http.ResponseWriter, r *http.Request) {

	userName := r.PathValue("userName")
	replId := r.PathValue("replId")

	log.Println(userName, replId)

	// TODO: Check whether replId exists or not?

	if err := k8s.CreateReplDeploymentAndService(userName, replId); err != nil {
		log.Fatal("K8s Deployment Failed", err)
		json.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// TODO: Copy Files from S3 to Runner

	json.WriteJSON(w, http.StatusOK, "Success")
}

func deleteRepl(w http.ResponseWriter, r *http.Request) {

	userName := r.PathValue("userName")
	replId := r.PathValue("replId")

	log.Println(userName, replId)

	// TODO: Check whether replId exists or not?
	// TODO: Send Back all data to repl
	// TODO: Delete Repl
	// TODO: Copy Files from S3 to Runner

	json.WriteJSON(w, http.StatusOK, "Success")
}
