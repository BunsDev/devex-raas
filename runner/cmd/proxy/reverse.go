package proxy

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strconv"
	"strings"
)

func ReverseProxyHandler(w http.ResponseWriter, r *http.Request) {

	parts := strings.SplitN(r.URL.Path, "/", 4) // ["", "user-app", "5000", "some/path"]
	if len(parts) < 3 {
		http.Error(w, "Invalid user-app path", http.StatusBadRequest)
		return
	}

	portStr := parts[2]
	port, err := strconv.Atoi(portStr)
	if err != nil || port < 1024 || port > 65535 {
		http.Error(w, "Invalid port", http.StatusBadRequest)
		return
	}

	targetURL := fmt.Sprintf("http://localhost:%d", port)
	remote, err := url.Parse(targetURL)
	if err != nil {
		http.Error(w, "Invalid target URL", http.StatusInternalServerError)
		return
	}

	proxyService := httputil.NewSingleHostReverseProxy(remote)

	// Rewrite the request path (strip /user-app/<port>)
	r.URL.Path = "/" + strings.Join(parts[3:], "/")

	proxyService.ServeHTTP(w, r)
}
