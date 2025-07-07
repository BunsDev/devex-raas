package email

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"net/http"
	"net/mail"
	"strings"
	"time"

	"github.com/parthkapoor-dev/core/internal/session"
	"github.com/parthkapoor-dev/core/pkg/dotenv"
	"github.com/parthkapoor-dev/core/pkg/gomail"
)

const (
	TokenLength     = 32
	TokenLifetime   = 15 * time.Minute
	RateLimitWindow = 1 * time.Minute
	MaxAttempts     = 3
)

func GenerateSecureToken() (string, error) {
	bytes := make([]byte, TokenLength)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}

func ValidateEmail(email string) error {
	email = strings.TrimSpace(email)
	if email == "" {
		return fmt.Errorf("email is required")
	}

	_, err := mail.ParseAddress(email)
	if err != nil {
		return fmt.Errorf("invalid email format: %v", err)
	}

	return nil
}

func CheckRateLimit(r *http.Request, email string) error {
	// Get session for rate limiting
	session, err := session.Store.Get(r, "rate-limit")
	if err != nil {
		return nil // Allow if we can't get session
	}

	key := fmt.Sprintf("magic-link:%s", email)
	now := time.Now()

	// Get existing attempts
	if data, exists := session.Values[key]; exists {
		if attempts, ok := data.(map[string]any); ok {
			if lastAttempt, ok := attempts["last_attempt"].(time.Time); ok {
				if count, ok := attempts["count"].(int); ok {
					// Reset counter if window expired
					if now.Sub(lastAttempt) > RateLimitWindow {
						count = 0
					}

					if count >= MaxAttempts {
						return fmt.Errorf("rate limit exceeded")
					}

					// Update counter
					attempts["count"] = count + 1
					attempts["last_attempt"] = now
				}
			}
		}
	} else {
		// First attempt
		session.Values[key] = map[string]any{
			"count":        1,
			"last_attempt": now,
		}
	}

	session.Options.MaxAge = int(RateLimitWindow.Seconds())
	session.Save(r, nil)
	return nil
}

func SendMagicLink(email, token string) error {
	url := dotenv.EnvString("MAGICLINK_REDIRECT_URL", "http://localhost:8080/auth/magiclink/verify")
	magicLink := fmt.Sprintf("%s?token=%s", url, token)

	subject := "Sign in to your account"
	body := fmt.Sprintf(`
		<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>Sign in to DevEx</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0a; color: #ffffff;">
	<div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0a0a0a 0%%, #1a1a1a 100%%);">
		<!-- Header -->
		<div style="background: linear-gradient(90deg, #064e3b 0%%, #059669 50%%, #064e3b 100%%); padding: 30px 40px; text-align: center; border-radius: 0 0 20px 20px;">
			<div style="display: inline-block; background: rgba(255, 255, 255, 0.1); padding: 15px 20px; border-radius: 12px; backdrop-filter: blur(10px); border: 1px solid rgba(16, 185, 129, 0.3);">
				<h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #10b981; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">
					DevEx
				</h1>
				<p style="margin: 5px 0 0 0; font-size: 14px; color: #d1fae5; opacity: 0.9;">
					Cloud Development IDE
				</p>
			</div>
		</div>

		<!-- Main Content -->
		<div style="padding: 40px;">
			<button style="color: #10b981; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">
				Sign in to your account
			</button>

			<p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
				Click the button below to sign in to your DevEx account. This secure link will expire in 15 minutes.
			</p>

			<!-- Sign In Button -->
			<div style="text-align: center; margin: 40px 0;">
				<a href="%s" style="background: linear-gradient(135deg, #10b981 0%%, #059669 100%%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); transition: all 0.3s ease; border: 1px solid rgba(16, 185, 129, 0.2);">
					🚀 Sign In to DevEx
				</a>
			</div>

			<!-- Fallback Link -->
			<div style="background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 20px; margin: 30px 0;">
				<p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">
					If the button doesn't work, copy and paste this link:
				</p>
				<p style="word-break: break-all; color: #10b981; font-size: 14px; margin: 0; font-family: 'Courier New', monospace; background: #0f172a; padding: 10px; border-radius: 4px; border: 1px solid #374151;">
					%s
				</p>
			</div>

			<!-- About DevEx -->
			<div style="background: linear-gradient(135deg, #1f2937 0%%, #111827 100%%); border: 1px solid #374151; border-radius: 12px; padding: 30px; margin: 30px 0; position: relative;">
				<div style="position: absolute; top: -1px; left: -1px; right: -1px; height: 2px; background: linear-gradient(90deg, #10b981, #059669, #10b981); border-radius: 12px 12px 0 0;"></div>

				<h3 style="color: #10b981; font-size: 20px; margin: 0 0 15px 0; font-weight: 600;">
					⚡ About DevEx
				</h3>

				<p style="color: #d1d5db; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0;">
					DevEx is a cloud development IDE that leverages Kubernetes to spin up new REPLs instantly. Think <strong>Replit</strong> but open-source, custom-built, and containerized! Write code, use terminals, and persist your work — all through your browser.
				</p>

				<div style="display: flex; flex-wrap: wrap; gap: 8px; margin: 20px 0;">
					<span style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 4px 12px; border-radius: 20px; font-size: 12px; border: 1px solid rgba(16, 185, 129, 0.2);">☸️ Kubernetes</span>
					<span style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 4px 12px; border-radius: 20px; font-size: 12px; border: 1px solid rgba(16, 185, 129, 0.2);">🐳 Containerized</span>
					<span style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 4px 12px; border-radius: 20px; font-size: 12px; border: 1px solid rgba(16, 185, 129, 0.2);">🌐 Browser-based</span>
					<span style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 4px 12px; border-radius: 20px; font-size: 12px; border: 1px solid rgba(16, 185, 129, 0.2);">🚀 Instant REPLs</span>
				</div>

				<!-- Developer Info -->
				<div style="border-top: 1px solid #374151; padding-top: 20px; margin-top: 20px;">
					<p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">
						<strong>Developer:</strong> Parth Kapoor<br>
						<strong>Contact:</strong> <a href="mailto:parthkapoor.coder@gmail.com" style="color: #10b981; text-decoration: none;">parthkapoor.coder@gmail.com</a><br>
						<strong>Portfolio:</strong> <a href="https://parthkapoor.me" style="color: #10b981; text-decoration: none;">parthkapoor.me</a>
					</p>
				</div>

				<!-- Open Source -->
				<div style="text-align: center; margin: 20px 0 0 0;">
					<a href="https://github.com/parthkapoor-dev/devex" style="background: #1f2937; color: #10b981; padding: 10px 20px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 14px; border: 1px solid #374151; font-weight: 500;">
						⭐ Star on GitHub
					</a>
					<p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">
						Open source • Try it out • Contribute
					</p>
				</div>
			</div>

			<!-- Important Notice -->
			<div style="background: #7c2d12; border: 1px solid #dc2626; border-radius: 8px; padding: 15px; margin: 20px 0;">
				<p style="color: #fecaca; font-size: 13px; margin: 0; font-weight: 500;">
					⚠️ <strong>Limited DevOps Features:</strong> Magic Link authentication doesn't support GitHub integrations, CI/CD pipelines, and repository management features.
				</p>
			</div>

			<!-- Footer -->
			<div style="border-top: 1px solid #374151; padding-top: 20px; margin-top: 40px;">
				<p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
					If you didn't request this email, you can safely ignore it.<br>
					This link expires in 15 minutes for security.
				</p>
			</div>
		</div>
	</div>
</body>
</html>
`, magicLink, magicLink)

	return gomail.SendEmail(email, subject, body)
}

func ExtractNameFromEmail(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) > 0 {
		return parts[0]
	}
	return email
}
