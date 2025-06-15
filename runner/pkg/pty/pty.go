package pty

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"os/exec"
	"sync"
	"syscall"
	"unsafe"

	"github.com/creack/pty"
)

// PTYManager manages multiple PTY sessions
type PTYManager struct {
	sessions map[string]*PTYSession
	mutex    sync.RWMutex
}

// PTYSession represents a single PTY session
type PTYSession struct {
	ID      string
	PTY     *os.File
	CMD     *exec.Cmd
	done    chan struct{}
	mutex   sync.RWMutex
	onData  func([]byte) // Callback for output data
	onClose func()       // Callback when session closes
}

// PTYConfig holds configuration for PTY creation
type PTYConfig struct {
	Shell       string            // Shell to use (default: /bin/bash)
	WorkingDir  string            // Working directory
	Environment map[string]string // Additional environment variables
	Cols        int               // Initial terminal columns
	Rows        int               // Initial terminal rows
}

// NewPTYManager creates a new PTY manager
func NewPTYManager() *PTYManager {
	return &PTYManager{
		sessions: make(map[string]*PTYSession),
	}
}

// CreateSession creates a new PTY session with the given configuration
func (pm *PTYManager) CreateSession(sessionID string, config *PTYConfig) (*PTYSession, error) {
	pm.mutex.Lock()
	defer pm.mutex.Unlock()

	// Check if session already exists
	if _, exists := pm.sessions[sessionID]; exists {
		return nil, fmt.Errorf("session %s already exists", sessionID)
	}

	// Set defaults
	if config == nil {
		config = &PTYConfig{}
	}
	if config.Shell == "" {
		config.Shell = "/bin/bash"
	}
	if config.Cols == 0 {
		config.Cols = 80
	}
	if config.Rows == 0 {
		config.Rows = 24
	}

	// Create command
	cmd := exec.Command(config.Shell)

	// Set working directory - FIXED LOGIC
	if config.WorkingDir != "" {
		cmd.Dir = config.WorkingDir
	} else {
		// Set default working directory
		cmd.Dir = "/workspaces" // or whatever your default should be
	}

	// Set environment
	cmd.Env = os.Environ()
	cmd.Env = append(cmd.Env,
		"TERM=xterm-256color",
		fmt.Sprintf("COLUMNS=%d", config.Cols),
		fmt.Sprintf("LINES=%d", config.Rows),
	)

	// Add custom environment variables
	for key, value := range config.Environment {
		cmd.Env = append(cmd.Env, fmt.Sprintf("%s=%s", key, value))
	}

	// Start PTY with initial size
	ptyFile, err := pty.StartWithSize(cmd, &pty.Winsize{
		Rows: uint16(config.Rows),
		Cols: uint16(config.Cols),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to start PTY: %v", err)
	}

	session := &PTYSession{
		ID:   sessionID,
		PTY:  ptyFile,
		CMD:  cmd,
		done: make(chan struct{}),
	}

	pm.sessions[sessionID] = session

	// Start the session handler
	go session.start()

	return session, nil
}

// GetSession retrieves a session by ID
func (pm *PTYManager) GetSession(sessionID string) (*PTYSession, bool) {
	pm.mutex.RLock()
	defer pm.mutex.RUnlock()
	session, exists := pm.sessions[sessionID]
	return session, exists
}

// RemoveSession removes a session from the manager
func (pm *PTYManager) RemoveSession(sessionID string) {
	pm.mutex.Lock()
	defer pm.mutex.Unlock()

	if session, exists := pm.sessions[sessionID]; exists {
		session.Close()
		delete(pm.sessions, sessionID)
	}
}

// ListSessions returns all active session IDs
func (pm *PTYManager) ListSessions() []string {
	pm.mutex.RLock()
	defer pm.mutex.RUnlock()

	sessions := make([]string, 0, len(pm.sessions))
	for id := range pm.sessions {
		sessions = append(sessions, id)
	}
	return sessions
}

// GetSessionStatus returns status information for a session
func (pm *PTYManager) GetSessionStatus(sessionID string) (map[string]interface{}, error) {
	session, exists := pm.GetSession(sessionID)
	if !exists {
		return nil, fmt.Errorf("session %s not found", sessionID)
	}
	return session.GetStatus(), nil
}

// Cleanup closes all sessions and cleans up resources
func (pm *PTYManager) Cleanup() {
	pm.mutex.Lock()
	defer pm.mutex.Unlock()

	for _, session := range pm.sessions {
		session.Close()
	}
	pm.sessions = make(map[string]*PTYSession)
}

// start begins the PTY session lifecycle
func (s *PTYSession) start() {
	defer s.cleanup()

	// Start reading from PTY
	go s.readFromPTY()

	// Wait for process to complete or session to be closed
	s.CMD.Wait()
	close(s.done)
}

// readFromPTY continuously reads output from the PTY
func (s *PTYSession) readFromPTY() {
	buffer := make([]byte, 4096)

	for {
		select {
		case <-s.done:
			return
		default:
			n, err := s.PTY.Read(buffer)
			if err != nil {
				if err != io.EOF {
					// PTY closed or error occurred
				}
				close(s.done)
				return
			}

			if n > 0 {
				data := make([]byte, n)
				copy(data, buffer[:n])

				// Call the data callback if set
				s.mutex.RLock()
				if s.onData != nil {
					s.onData(data)
				}
				s.mutex.RUnlock()
			}
		}
	}
}

// WriteInput writes input to the PTY
func (s *PTYSession) WriteInput(data []byte) error {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	if s.PTY == nil {
		return fmt.Errorf("PTY is closed")
	}

	_, err := s.PTY.Write(data)
	return err
}

// WriteString writes a string to the PTY
func (s *PTYSession) WriteString(input string) error {
	return s.WriteInput([]byte(input))
}

// Resize changes the PTY size
func (s *PTYSession) Resize(cols, rows int) error {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	if s.PTY == nil {
		return fmt.Errorf("PTY is closed")
	}

	return pty.Setsize(s.PTY, &pty.Winsize{
		Rows: uint16(rows),
		Cols: uint16(cols),
	})
}

// GetSize returns the current PTY size
func (s *PTYSession) GetSize() (*pty.Winsize, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	if s.PTY == nil {
		return nil, fmt.Errorf("PTY is closed")
	}

	size := &pty.Winsize{}
	err := getSize(s.PTY, size)
	return size, err
}

// getSize gets the current terminal size
func getSize(pty *os.File, size *pty.Winsize) error {
	_, _, errno := syscall.Syscall(
		syscall.SYS_IOCTL,
		pty.Fd(),
		syscall.TIOCGWINSZ,
		uintptr(unsafe.Pointer(size)),
	)

	if errno != 0 {
		return errno
	}
	return nil
}

// SetOnDataCallback sets the callback function for output data
func (s *PTYSession) SetOnDataCallback(callback func([]byte)) {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	s.onData = callback
}

// SetOnCloseCallback sets the callback function for when session closes
func (s *PTYSession) SetOnCloseCallback(callback func()) {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	s.onClose = callback
}

// GetStatus returns current session status
func (s *PTYSession) GetStatus() map[string]interface{} {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	status := map[string]interface{}{
		"id":     s.ID,
		"active": s.PTY != nil,
	}

	if s.CMD != nil && s.CMD.Process != nil {
		status["pid"] = s.CMD.Process.Pid
		status["processState"] = s.CMD.ProcessState
	}

	// Get terminal size if available
	if s.PTY != nil {
		if size, err := s.GetSize(); err == nil {
			status["size"] = map[string]interface{}{
				"cols": size.Cols,
				"rows": size.Rows,
			}
		}
	}

	return status
}

// IsActive returns whether the session is currently active
func (s *PTYSession) IsActive() bool {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	return s.PTY != nil
}

// SendSignal sends a signal to the PTY process
func (s *PTYSession) SendSignal(sig os.Signal) error {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	if s.CMD == nil || s.CMD.Process == nil {
		return fmt.Errorf("no process to signal")
	}

	return s.CMD.Process.Signal(sig)
}

// Kill forcefully terminates the PTY session
func (s *PTYSession) Kill() error {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	if s.CMD == nil || s.CMD.Process == nil {
		return fmt.Errorf("no process to kill")
	}

	return s.CMD.Process.Kill()
}

// Close gracefully closes the PTY session
func (s *PTYSession) Close() {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Close done channel if not already closed
	select {
	case <-s.done:
		// Already closed
	default:
		close(s.done)
	}

	s.cleanup()
}

// cleanup handles resource cleanup
func (s *PTYSession) cleanup() {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Close PTY
	if s.PTY != nil {
		s.PTY.Close()
		s.PTY = nil
	}

	// Kill process if still running
	if s.CMD != nil && s.CMD.Process != nil {
		s.CMD.Process.Kill()
		s.CMD.Wait() // Clean up zombie process
	}

	// Call close callback
	if s.onClose != nil {
		go s.onClose() // Call in goroutine to avoid deadlocks
	}
}

// ExecuteCommand executes a single command and returns when complete
func (s *PTYSession) ExecuteCommand(command string) error {
	return s.WriteString(command + "\n")
}

// ReadUntilPrompt reads output until a shell prompt appears (basic implementation)
func (s *PTYSession) ReadUntilPrompt(timeout int) ([]byte, error) {
	// This is a simplified implementation
	// In production, you'd want more sophisticated prompt detection
	buffer := make([]byte, 4096)
	n, err := s.PTY.Read(buffer)
	if err != nil {
		return nil, err
	}
	return buffer[:n], nil
}

// GetReader returns an io.Reader for the PTY output
func (s *PTYSession) GetReader() io.Reader {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	return s.PTY
}

// GetWriter returns an io.Writer for the PTY input
func (s *PTYSession) GetWriter() io.Writer {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	return s.PTY
}

// NewBufferedReader returns a buffered reader for the PTY
func (s *PTYSession) NewBufferedReader() *bufio.Reader {
	return bufio.NewReader(s.GetReader())
}

// NewBufferedWriter returns a buffered writer for the PTY
func (s *PTYSession) NewBufferedWriter() *bufio.Writer {
	return bufio.NewWriter(s.GetWriter())
}
