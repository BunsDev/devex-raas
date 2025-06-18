package repl

import (
	"fmt"
	"log"
	"net/http"
	"os/exec"
	"strings"

	"github.com/parthkapoor-dev/core/cmd/middleware"
	"github.com/parthkapoor-dev/core/internal/k8s"
	"github.com/parthkapoor-dev/core/internal/redis"
	"github.com/parthkapoor-dev/core/internal/s3"
	"github.com/parthkapoor-dev/core/models"
	"github.com/parthkapoor-dev/core/pkg/json"
)

func NewHandler(s3Client *s3.S3Client, rds *redis.Redis) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /test", func(w http.ResponseWriter, r *http.Request) {
		log.Println("The Protected Route is Accessed")
		json.WriteJSON(w, http.StatusOK, "Success")
	})

	mux.HandleFunc("POST /new", func(w http.ResponseWriter, r *http.Request) {
		newRepl(w, r, s3Client, rds)
	})
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		getUserRepls(w, r, rds)
	})
	mux.HandleFunc("GET /{replId}", func(w http.ResponseWriter, r *http.Request) {
		startReplSession(w, r, rds)
	})
	mux.HandleFunc("DELETE /{replId}", func(w http.ResponseWriter, r *http.Request) {
		endReplSession(w, r, rds)
	})

	return mux
}

func newRepl(w http.ResponseWriter, r *http.Request, s3Client *s3.S3Client, rds *redis.Redis) {

	var repl *newReplRequest
	if err := json.ReadJSON(r, &repl); err != nil {
		json.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Get User from auth
	user, _ := middleware.GetUserFromContext(r.Context())
	userName := strings.ToLower(user.Login)

	// Create Repl ID
	uuid, err := exec.Command("uuidgen").Output()
	if err != nil {
		log.Fatal(err)
	}
	replID := strings.TrimSpace(string(uuid))

	// Create Repl in Store
	if err := rds.CreateRepl(userName, repl.ReplName, replID); err != nil {
		log.Fatal(err)
		json.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	destinationPrefix := fmt.Sprintf("repl/%s/%s/", userName, replID)
	if err := s3Client.CopyFolder(repl.Template, destinationPrefix); err != nil {
		log.Fatal("S3 CopyTemplate is giving Err: ", err)
		json.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	json.WriteJSON(w, http.StatusOK, "Success")
}

func getUserRepls(w http.ResponseWriter, r *http.Request, rds *redis.Redis) {

	user, _ := middleware.GetUserFromContext(r.Context())
	userName := strings.ToLower(user.Login)

	replIds, err := rds.GetUserRepls(userName)
	if err != nil {
		json.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var repls []models.Repl
	for _, id := range replIds {
		repl, err := rds.GetRepl(id)
		if err != nil {
			log.Fatalf("This replId: %s doesn't exists for %s user", id, userName)
			continue
		}
		repls = append(repls, repl)
	}

	json.WriteJSON(w, http.StatusOK, repls)
}

func startReplSession(w http.ResponseWriter, r *http.Request, rds *redis.Redis) {

	user, _ := middleware.GetUserFromContext(r.Context())
	userName := strings.ToLower(user.Login)

	replId := r.PathValue("replId")

	repl, err := rds.GetRepl(replId)
	if err != nil {
		log.Fatal(err)
		json.WriteError(w, http.StatusBadRequest, "This Repl Id doesn't exists")
		return
	}
	if repl.User != userName {
		json.WriteError(w, http.StatusUnauthorized, "This User doesn't have access to this Repl")
		return
	}

	if err := rds.CreateReplSession(replId); err != nil {
		json.WriteError(w, http.StatusInternalServerError, "Unable to Create Repl Session")
	}

	if err := k8s.CreateReplDeploymentAndService(userName, replId); err != nil {
		log.Fatal("K8s Deployment Failed", err)
		json.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	json.WriteJSON(w, http.StatusOK, "Success")
}

func endReplSession(w http.ResponseWriter, r *http.Request, rds *redis.Redis) {

	user, _ := middleware.GetUserFromContext(r.Context())
	userName := strings.ToLower(user.Login)

	replId := r.PathValue("replId")

	repl, err := rds.GetRepl(replId)
	if err != nil {
		json.WriteError(w, http.StatusBadRequest, "This Repl Id doesn't exists")
		return
	}
	if repl.User != userName {
		json.WriteError(w, http.StatusUnauthorized, "This User doesn't have access to this Repl")
		return
	}

	if val, err := rds.DeleteReplSession(replId); err != nil || val == 0 {
		json.WriteError(w, http.StatusInternalServerError, "Unable to Create Repl Session")
	}

	if err := k8s.DeleteReplDeploymentAndService(userName, replId); err != nil {
		log.Fatal("k8s Repl Deletion Failed", err)
		json.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	json.WriteJSON(w, http.StatusOK, "Success")
}
