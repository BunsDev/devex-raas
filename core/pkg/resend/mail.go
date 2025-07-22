package resend

import (
	"core/pkg/dotenv"

	"github.com/resend/resend-go/v2"
)

type Resend struct {
	client *resend.Client
}

func (r *Resend) SendEmail(email, subject, body string) error {

	params := &resend.SendEmailRequest{
		From:    "no-reply@devx.parthkapoor.me",
		To:      []string{email},
		Subject: subject,
		Html:    body,
	}

	_, err := r.client.Emails.Send(params)
	return err
}

func NewClient() *Resend {
	return &Resend{
		client: resend.NewClient(dotenv.EnvString("RESEND_API_KEY", "")),
	}
}
