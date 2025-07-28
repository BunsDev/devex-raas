package pty

import "sync"

var (
	once       sync.Once
	ptyManager *PTYManager
)

func GetPTYManager() *PTYManager {
	once.Do(func() {
		ptyManager = NewPTYManager()
	})
	return ptyManager
}
