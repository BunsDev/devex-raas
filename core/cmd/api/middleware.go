package api

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/parthkapoor-dev/core/internal/oauth"
	"github.com/parthkapoor-dev/core/internal/session"
	"github.com/parthkapoor-dev/core/models"
	"github.com/parthkapoor-dev/core/pkg/json"
	"golang.org/x/oauth2"
)

type contextKey string

const UserContextKey contextKey = "user"

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenInfo, err := session.GetSession(r)
		if err != nil || tokenInfo == nil {
			json.WriteError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		// Check if token is expired
		if time.Now().After(tokenInfo.ExpiresAt) {
			// Try to refresh token
			newToken, err := refreshToken(tokenInfo.Token)
			if err != nil {
				log.Printf("Failed to refresh token: %v", err)
				session.ClearSession(w, r)
				json.WriteError(w, http.StatusUnauthorized, "Token expired")
				return
			}

			// Update token info
			tokenInfo.Token = newToken
			tokenInfo.ExpiresAt = newToken.Expiry

			// Save updated session
			if err := session.SaveSession(w, r, tokenInfo); err != nil {
				log.Printf("Failed to save refreshed session: %v", err)
				json.WriteError(w, http.StatusInternalServerError, "Internal server error")
				return
			}
		}

		// Add user to context
		ctx := context.WithValue(r.Context(), UserContextKey, tokenInfo.User)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func refreshToken(token *oauth2.Token) (*oauth2.Token, error) {
	tokenSource := oauth.GithubOauthConfig.TokenSource(context.Background(), token)
	newToken, err := tokenSource.Token()
	if err != nil {
		return nil, err
	}
	return newToken, nil
}

func OptionalAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenInfo, err := session.GetSession(r)
		if err == nil && tokenInfo != nil {
			// Check if token is expired and try to refresh
			if time.Now().After(tokenInfo.ExpiresAt) {
				newToken, err := refreshToken(tokenInfo.Token)
				if err == nil {
					tokenInfo.Token = newToken
					tokenInfo.ExpiresAt = newToken.Expiry
					session.SaveSession(w, r, tokenInfo)
				}
			}

			if tokenInfo.User != nil {
				ctx := context.WithValue(r.Context(), UserContextKey, tokenInfo.User)
				r = r.WithContext(ctx)
			}
		}

		next.ServeHTTP(w, r)
	})
}

func GetUserFromContext(ctx context.Context) (*models.User, bool) {
	user, ok := ctx.Value(UserContextKey).(*models.User)
	return user, ok
}
