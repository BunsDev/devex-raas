package pty

import (
	"os"
	"os/exec"

	"github.com/creack/pty"
)

type TerminalSession struct {
	cmd  *exec.Cmd
	ptmx *os.File
}

func StartTerminal(replId string) (*TerminalSession, error) {
	cmd := exec.Command("bash") // Replace with dynamic runner container shell if needed

	ptmx, err := pty.Start(cmd)
	if err != nil {
		return nil, err
	}

	return &TerminalSession{cmd: cmd, ptmx: ptmx}, nil
}
