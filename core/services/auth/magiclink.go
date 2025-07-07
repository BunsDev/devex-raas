package auth

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"github.com/parthkapoor-dev/core/internal/email"
	sessionManager "github.com/parthkapoor-dev/core/internal/session"
	"github.com/parthkapoor-dev/core/models"
	"github.com/parthkapoor-dev/core/pkg/dotenv"
	"github.com/parthkapoor-dev/core/pkg/resend"
)

type MagicLinkData struct {
	Token     string    `json:"token"`
	Email     string    `json:"email"`
	ExpiresAt time.Time `json:"expires_at"`
}

type LoginRequest struct {
	Email string `json:"email"`
}

type LoginResponse struct {
	Message string `json:"message"`
	Success bool   `json:"success"`
}

const (
	TokenLength     = 32
	TokenLifetime   = 15 * time.Minute
	RateLimitWindow = 1 * time.Minute
	MaxAttempts     = 3
)

func magiclinkLoginHandler(w http.ResponseWriter, r *http.Request, resend *resend.Resend) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Error decoding login request: %v", err)
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate email
	if err := email.ValidateEmail(req.Email); err != nil {
		log.Printf("Invalid email: %v", err)
		writeError(w, http.StatusBadRequest, "Invalid email address")
		return
	}

	// Normalize email
	norm_email := strings.ToLower(strings.TrimSpace(req.Email))

	// Check rate limiting
	if err := email.CheckRateLimit(r, norm_email); err != nil {
		log.Printf("Rate limit exceeded for email %s: %v", norm_email, err)
		writeError(w, http.StatusTooManyRequests, "Too many requests. Please try again later.")
		return
	}

	// Generate secure token
	token, err := email.GenerateToken(req.Email)
	if err != nil {
		log.Printf("Error generating token: %v", err)
		writeError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	// Send magic link email
	subject, body := email.GenerateMagicLink(norm_email, token)
	if err := resend.SendEmail(norm_email, subject, body); err != nil {
		log.Printf("Error sending magic link email: %v", err)
		writeError(w, http.StatusInternalServerError, "Failed to send magic link")
		return
	}

	// Always return success to prevent email enumeration
	writeJSON(w, LoginResponse{
		Message: "Magic link sent! Check your email and click the link to sign in.",
		Success: true,
	})
}

func magiclinkCallbackHandler(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		log.Println("Missing token in verification request")
		redirectWithError(w, r, "missing_token")
		return
	}

	validatedEmail, err := email.ValidateToken(token)
	if err != nil {
		log.Printf("Error retrieving magic link data: %v", err)
		redirectWithError(w, r, "invalid_token")
		return
	}
	name := email.ExtractNameFromEmail(validatedEmail)

	// TODO: Complete User Info
	user := &models.User{
		Name:      name,
		Login:     name,
		Email:     validatedEmail,
		AvatarURL: getAvatarUrl(),
		CreatedAt: time.Now(),
	}

	// Create token info for session (magic link doesn't use OAuth tokens)
	tokenInfo := &models.TokenInfo{
		Token:     nil, // No OAuth token for magic link
		User:      user,
		ExpiresAt: time.Now().Add(24 * time.Hour), // 24 hour session
	}

	// Save session
	if err := sessionManager.SaveSession(w, r, tokenInfo); err != nil {
		log.Printf("Failed to save session: %v", err)
		redirectWithError(w, r, "session_save_failed")
		return
	}

	// Redirect to frontend dashboard
	frontendURL := dotenv.EnvString("FRONTEND_URL", "http://localhost:3000")
	http.Redirect(w, r, frontendURL+"/dashboard", http.StatusTemporaryRedirect)
}

// Helper methods
func redirectWithError(w http.ResponseWriter, r *http.Request, errorType string) {
	frontendURL := dotenv.EnvString("FRONTEND_URL", "http://localhost:3000")
	http.Redirect(w, r, fmt.Sprintf("%s?error=%s", frontendURL, errorType), http.StatusTemporaryRedirect)
}

func writeJSON(w http.ResponseWriter, data any) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("Error encoding JSON response: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

func writeError(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

func getAvatarUrl() string {
	items := []string{
		"https://i.imgur.com/s7OesTE.png", "https://i.imgur.com/VBq30D6.png",
		"https://i.imgur.com/jIduwzv.png", "https://i.imgur.com/YvQx6FN.png",
		"https://i.imgur.com/r3m3hf6.png", "https://i.imgur.com/h60wtoz.png",
		"https://i.imgur.com/OtlH2uM.png", "https://i.imgur.com/aNQLbGl.png",
	}

	// Create a local random generator seeded with the current time
	r := rand.New(rand.NewSource(time.Now().UnixNano()))

	return items[r.Intn(len(items))]
}
