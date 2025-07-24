package gomail

import (
	"errors"

	"core/pkg/dotenv"

	"gopkg.in/gomail.v2"
)

var (
	user = dotenv.EnvString("GMAIL_USER", "")
	pass = dotenv.EnvString("GMAIL_PASSWORD", "")
)

func SendEmail(email, subject, body string) error {

	if pass == "" {
		return errors.New("GMAIL APP PASSWORD is required in .env")
	}
	if user == "" {
		return errors.New("GMAIL SENDER-EMAIL is required in .env")
	}

	m := gomail.NewMessage()
	m.SetHeader("From", user)
	m.SetHeader("To", email)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", body)

	d := gomail.NewDialer("smtp.gmail.com", 465, user, pass)
	return d.DialAndSend(m)
}
