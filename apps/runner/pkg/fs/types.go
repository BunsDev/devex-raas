package fs

type DirEntry struct {
	Name  string `json:"name"`
	IsDir bool   `json:"isDir"`
}

// Clipboard represents the clipboard state for cut/copy operations
type Clipboard struct {
	SourcePath string
	Operation  string // "copy" or "cut"
}
