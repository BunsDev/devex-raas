package runner

import (
	"log"
	"net/http"
	"strings"

	"github.com/parthkapoor-dev/core/internal/k8s"
	"github.com/parthkapoor-dev/core/internal/redis"
	"github.com/parthkapoor-dev/core/pkg/json"
)

func NewHandler(rds *redis.Redis) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("DELETE /{replId}", func(w http.ResponseWriter, r *http.Request) {
		endReplSession(w, r, rds)
	})

	return mux
}

func endReplSession(w http.ResponseWriter, r *http.Request, rds *redis.Redis) {

	replId := r.PathValue("replId")

	uuid_replId := strings.Split(replId, "-")[0]

	repl, err := rds.GetRepl(uuid_replId)
	if err != nil {
		json.WriteError(w, http.StatusBadRequest, "This Repl Id doesn't exists")
		return
	}
	userName := repl.User

	if val, err := rds.DeleteReplSession(uuid_replId); err != nil || val == 0 {
		json.WriteError(w, http.StatusInternalServerError, "Unable to Create Repl Session")
	}

	if err := k8s.DeleteReplDeploymentAndService(userName, replId); err != nil {
		log.Println("k8s Repl Deletion Failed", err)
		json.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	json.WriteJSON(w, http.StatusOK, "Success")
}
