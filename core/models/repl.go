package models

type Repl struct {
	User     string `json:"user"`
	Id       string `json:"id"`
	Name     string `json:"name"`
	IsActive bool   `json:"isActive"`
}
