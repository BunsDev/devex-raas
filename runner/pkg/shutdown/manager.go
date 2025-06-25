package shutdown

import (
	"context"
	"log"
	"sync"
	"time"
)

// ShutdownCallback represents a function that will be called to shutdown the instance
type ShutdownCallback func(replId string) error

// ShutdownManager manages auto-shutdown logic for REPL instances
type ShutdownManager struct {
	replId           string
	shutdownCallback ShutdownCallback
	timer            *time.Timer
	mu               sync.RWMutex
	isShutdown       bool
	ctx              context.Context
	cancel           context.CancelFunc
	connectionActive bool
	inactivityPeriod time.Duration
}

// NewShutdownManager creates a new shutdown manager instance
func NewShutdownManager(replId string, callback ShutdownCallback) *ShutdownManager {
	ctx, cancel := context.WithCancel(context.Background())

	sm := &ShutdownManager{
		replId:           replId,
		shutdownCallback: callback,
		ctx:              ctx,
		cancel:           cancel,
		inactivityPeriod: 4 * time.Minute,
		connectionActive: false,
	}

	// Start the initial shutdown timer
	sm.startShutdownTimer()

	log.Printf("Auto-shutdown manager initialized for repl: %s", replId)
	return sm
}

// startShutdownTimer starts or restarts the shutdown timer
func (sm *ShutdownManager) startShutdownTimer() {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	if sm.isShutdown {
		return
	}

	// Stop existing timer if any
	if sm.timer != nil {
		sm.timer.Stop()
	}

	sm.timer = time.AfterFunc(sm.inactivityPeriod, func() {
		sm.executeShutdown()
	})

	log.Printf("Shutdown timer started/restarted for repl: %s (%.0f minutes)",
		sm.replId, sm.inactivityPeriod.Minutes())
}

// OnConnectionEstablished should be called when a WebSocket connection is established
func (sm *ShutdownManager) OnConnectionEstablished() {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	if sm.isShutdown {
		return
	}

	sm.connectionActive = true

	// Stop the shutdown timer since we have an active connection
	if sm.timer != nil {
		sm.timer.Stop()
		sm.timer = nil
	}

	log.Printf("Connection established for repl: %s - shutdown timer stopped", sm.replId)
}

// OnConnectionClosed should be called when a WebSocket connection is closed
func (sm *ShutdownManager) OnConnectionClosed() {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	if sm.isShutdown {
		return
	}

	sm.connectionActive = false

	// Restart the shutdown timer since connection is closed
	sm.startShutdownTimer()

	log.Printf("Connection closed for repl: %s - shutdown timer restarted", sm.replId)
}

// executeShutdown performs the actual shutdown
func (sm *ShutdownManager) executeShutdown() {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	if sm.isShutdown {
		return
	}

	sm.isShutdown = true

	log.Printf("Executing auto-shutdown for repl: %s due to inactivity", sm.replId)

	// Call the shutdown callback
	if sm.shutdownCallback != nil {
		go func() {
			if err := sm.shutdownCallback(sm.replId); err != nil {
				log.Printf("Error during shutdown callback for repl %s: %v", sm.replId, err)
			} else {
				log.Printf("Successfully shutdown repl: %s", sm.replId)
			}
		}()
	}

	// Cancel the context to signal shutdown to other components
	sm.cancel()
}

// IsShutdown returns whether the instance has been shutdown
func (sm *ShutdownManager) IsShutdown() bool {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	return sm.isShutdown
}

// HasActiveConnection returns whether there's an active connection
func (sm *ShutdownManager) HasActiveConnection() bool {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	return sm.connectionActive
}

// Context returns the manager's context (cancelled on shutdown)
func (sm *ShutdownManager) Context() context.Context {
	return sm.ctx
}

// Close gracefully shuts down the manager
func (sm *ShutdownManager) Close() {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	if sm.isShutdown {
		return
	}

	if sm.timer != nil {
		sm.timer.Stop()
	}

	sm.isShutdown = true
	sm.cancel()

	log.Printf("Shutdown manager closed for repl: %s", sm.replId)
}

// SetInactivityPeriod allows customizing the inactivity period (useful for testing)
func (sm *ShutdownManager) SetInactivityPeriod(duration time.Duration) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	sm.inactivityPeriod = duration

	// If there's no active connection, restart timer with new duration
	if !sm.connectionActive && !sm.isShutdown {
		sm.startShutdownTimer()
	}
}
