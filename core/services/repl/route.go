package repl

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/parthkapoor-dev/core/cmd/middleware"
	"github.com/parthkapoor-dev/core/internal/k8s"
	"github.com/parthkapoor-dev/core/internal/redis"
	"github.com/parthkapoor-dev/core/internal/s3"
	"github.com/parthkapoor-dev/core/models"
	"github.com/parthkapoor-dev/core/pkg/dotenv"
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
	mux.HandleFunc("GET /session/{replId}", func(w http.ResponseWriter, r *http.Request) {
		activateRepl(w, r, rds)
	})
	mux.HandleFunc("DELETE /session/{replId}", func(w http.ResponseWriter, r *http.Request) {
		deactivateRepl(w, r, rds)
	})
	mux.HandleFunc("DELETE /{replId}", func(w http.ResponseWriter, r *http.Request) {
		deleteRepl(w, r, s3Client, rds)
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

	if userRepls, err := rds.GetUserRepls(userName); err == nil && len(userRepls) == 2 {
		log.Println("Cannot Create More Repls (Free Account Limit Reached): ")
		json.WriteError(w, http.StatusInternalServerError, "Free Account Limit Reached")
		return
	}

	// Create Repl ID
	id := uuid.New()
	replId := fmt.Sprintf("repl-%s", strings.TrimSpace(id.String()))

	sourcePrefix := fmt.Sprintf("templates/%s", repl.Template)
	destinationPrefix := fmt.Sprintf("repl/%s/%s/", userName, replId)

	if err := s3Client.CopyFolder(sourcePrefix, destinationPrefix); err != nil {
		log.Println("S3 CopyTemplate is giving Err: ", err)
		json.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Create Repl in Store
	if err := rds.CreateRepl(repl.Template, userName, repl.ReplName, replId); err != nil {
		log.Println(err)
		json.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	json.WriteJSON(w, http.StatusOK, "Success")
}

func deleteRepl(w http.ResponseWriter, r *http.Request, s3Client *s3.S3Client, rds *redis.Redis) {

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

	if repl.IsActive == true {
		if err := rds.DeleteReplSession(replId); err != nil {
			json.WriteError(w, http.StatusInternalServerError, "Unable to Create Repl Session")
			return
		}
	}

	destination := fmt.Sprintf("repl/%s/%s/", userName, repl.Id)
	if err := s3Client.DeleteFolder(destination); err != nil {
		log.Println("Delete S3 is giving Err: ", err)
		json.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Create Repl in Store
	if err := rds.DeleteRepl(repl.Id); err != nil {
		log.Println(err)
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
			log.Printf("This replId: %s doesn't exists for %s user", id, userName)
			continue
		}
		repls = append(repls, repl)
	}

	json.WriteJSON(w, http.StatusOK, repls)
}

func activateRepl(w http.ResponseWriter, r *http.Request, rds *redis.Redis) {

	user, _ := middleware.GetUserFromContext(r.Context())
	userName := strings.ToLower(user.Login)

	replId := r.PathValue("replId")

	repl, err := rds.GetRepl(replId)
	if err != nil {
		log.Println(err)
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

	if err := k8s.CreateReplDeploymentAndService(userName, replId, repl.Template); err != nil {
		log.Println("K8s Deployment Failed", err)
		json.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	url := fmt.Sprintf("https://%s/%s/ping", dotenv.EnvString("RUNNER_CLUSTER_IP", "localhost:8081"), replId)

	if err := pingRunner(url); err != nil {
		json.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	json.WriteJSON(w, http.StatusOK, map[string]string{
		"replId":   replId,
		"replName": repl.Name,
	})
}

func deactivateRepl(w http.ResponseWriter, r *http.Request, rds *redis.Redis) {

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

	if err := rds.DeleteReplSession(replId); err != nil {
		json.WriteError(w, http.StatusInternalServerError, "Unable to Create Repl Session")
	}

	if err := k8s.DeleteReplDeploymentAndService(userName, replId); err != nil {
		log.Println("k8s Repl Deletion Failed", err)
		json.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	json.WriteJSON(w, http.StatusOK, "Success")
}
