package fs

type DirEntry struct {
	Name  string `json:"name"`
	IsDir bool   `json:"isDir"`
}
