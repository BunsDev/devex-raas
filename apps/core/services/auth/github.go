package auth

import (
	"context"
	"log"
	"net/http"
	"time"

	"core/internal/oauth"
	sessionManager "core/internal/session"
	"core/models"
	"core/pkg/dotenv"

	"github.com/google/go-github/v57/github"
)

func githubLoginHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Login Handler")

	// Generate state for CSRF protection
	state := oauth.GenerateStateCookie()

	// Store state in session for verification
	session, err := sessionManager.Store.Get(r, "oauth-state")
	if err != nil {
		log.Printf("Error getting session: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	session.Values["state"] = state
	session.Options.MaxAge = 600 // 10 minutes
	if err := session.Save(r, w); err != nil {
		log.Printf("Error saving session: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	url := oauth.GithubOauthConfig.AuthCodeURL(state)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func githubCallbackHandler(w http.ResponseWriter, r *http.Request) {
	state := r.FormValue("state")

	// Verify state
	session, err := sessionManager.Store.Get(r, "oauth-state")
	if err != nil {
		log.Printf("Error getting state session: %v", err)
		http.Redirect(w, r, dotenv.EnvString("FRONTEND_URL", "http://localhost:3000")+"?error=session_error", http.StatusTemporaryRedirect)
		return
	}

	savedState, ok := session.Values["state"].(string)
	if !ok || savedState != state {
		log.Println("Invalid oauth state")
		http.Redirect(w, r, dotenv.EnvString("FRONTEND_URL", "http://localhost:3000")+"?error=invalid_state", http.StatusTemporaryRedirect)
		return
	}

	code := r.FormValue("code")
	token, err := oauth.GithubOauthConfig.Exchange(context.Background(), code)
	if err != nil {
		log.Printf("Code exchange failed: %v", err)
		http.Redirect(w, r, dotenv.EnvString("FRONTEND_URL", "http://localhost:3000")+"?error=exchange_failed", http.StatusTemporaryRedirect)
		return
	}

	// Get user info from GitHub
	client := github.NewClient(oauth.GithubOauthConfig.Client(context.Background(), token))
	githubUser, _, err := client.Users.Get(context.Background(), "")
	if err != nil {
		log.Printf("Failed to get user: %v", err)
		http.Redirect(w, r, dotenv.EnvString("FRONTEND_URL", "http://localhost:3000")+"?error=user_fetch_failed", http.StatusTemporaryRedirect)
		return
	}

	// Get user emails
	emails, _, err := client.Users.ListEmails(context.Background(), nil)
	if err != nil {
		log.Printf("Failed to get user emails: %v", err)
	}

	var primaryEmail string
	for _, email := range emails {
		if email.GetPrimary() {
			primaryEmail = email.GetEmail()
			break
		}
	}

	// Create user model
	user := &models.User{
		ID:        githubUser.GetID(),
		Login:     githubUser.GetLogin(),
		Name:      githubUser.GetName(),
		Email:     primaryEmail,
		AvatarURL: githubUser.GetAvatarURL(),
		CreatedAt: time.Now(),
	}

	// Create token info
	tokenInfo := &models.TokenInfo{
		Token:     token,
		User:      user,
		ExpiresAt: token.Expiry,
	}

	// Save session
	if err := sessionManager.SaveSession(w, r, tokenInfo); err != nil {
		log.Printf("Failed to save session: %v", err)
		http.Redirect(w, r, dotenv.EnvString("FRONTEND_URL", "http://localhost:3000")+"?error=session_save_failed", http.StatusTemporaryRedirect)
		return
	}

	// Clear state session
	session.Options.MaxAge = -1
	session.Save(r, w)

	// Redirect to frontend
	frontendURL := dotenv.EnvString("FRONTEND_URL", "http://localhost:3000")
	http.Redirect(w, r, frontendURL+"/dashboard", http.StatusTemporaryRedirect)
}
