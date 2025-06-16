package repl

type newReplRequest struct {
	UserName string `json:"userName"`
	Template string `json:"template"`
}
