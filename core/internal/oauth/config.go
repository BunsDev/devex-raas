package oauth

import (
	"crypto/rand"
	"encoding/base64"

	"github.com/parthkapoor-dev/core/pkg/dotenv"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
)

var (
	GithubOauthConfig = &oauth2.Config{
		ClientID:     dotenv.EnvString("GITHUB_CLIENT_ID", ""),
		ClientSecret: dotenv.EnvString("GITHUB_CLIENT_SECRET", ""),
		RedirectURL:  dotenv.EnvString("GITHUB_REDIRECT_URL", "http://localhost:8080/auth/github/callback"),
		Scopes:       []string{"read:user", "user:email"},
		Endpoint:     github.Endpoint,
	}

	// A random string for CSRF protection
	// TODO: make this an env variable
	State = "random-csrf-token"
)

// GenerateStateOauthCookie generates a random state string for CSRF protection
func GenerateStateCookie() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}
