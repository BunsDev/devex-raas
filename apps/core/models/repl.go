package models

type Repl struct {
	User     string `json:"user"`
	Id       string `json:"id"`
	Name     string `json:"name"`
	Template string `json:"template"`
	IsActive bool   `json:"isActive"`
}
