package fs

import (
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/sergi/go-diff/diffmatchpatch"
)

var clipboard *Clipboard

func FetchDir(basePath, relativePath string) ([]DirEntry, error) {
	fullPath := filepath.Join(basePath, relativePath)
	entries, err := os.ReadDir(fullPath)
	if err != nil {
		return nil, err
	}
	var result []DirEntry
	for _, entry := range entries {
		result = append(result, DirEntry{
			Name:  entry.Name(),
			IsDir: entry.IsDir(),
		})
	}
	return result, nil
}

func FetchFileContent(fullPath string) (string, error) {
	bytes, err := os.ReadFile(fullPath)
	return string(bytes), err
}

func SaveFileDiffs(fullPath, patch string) error {
	currentBytes, err := os.ReadFile(fullPath)
	if err != nil {
		return err
	}
	currentText := string(currentBytes)
	dmp := diffmatchpatch.New()
	patches, err := dmp.PatchFromText(patch)
	if err != nil {
		return err
	}
	newText, results := dmp.PatchApply(patches, currentText)
	for _, result := range results {
		if !result {
			return fmt.Errorf("failed to apply patch")
		}
	}
	if err := os.WriteFile(fullPath, []byte(newText), 0644); err != nil {
		return err
	}
	return nil
}

// CreateFile creates a new file at the specified path
func CreateFile(path string) error {
	// Create parent directories if they don't exist
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	// Create the file
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()

	return nil
}

// CreateFolder creates a new folder at the specified path
func CreateFolder(path string) error {
	return os.MkdirAll(path, 0755)
}

// Delete removes a file or folder at the specified path
func Delete(path string) error {
	return os.RemoveAll(path)
}

// Rename renames a file or folder from oldPath to newPath
func Rename(oldPath, newPath string) error {
	return os.Rename(oldPath, newPath)
}

// Copy copies a file or folder from sourcePath to targetPath
func Copy(sourcePath, targetPath string) error {
	sourceInfo, err := os.Stat(sourcePath)
	if err != nil {
		return err
	}

	if sourceInfo.IsDir() {
		return copyDir(sourcePath, targetPath)
	}
	return copyFile(sourcePath, targetPath)
}

// Cut sets up a cut operation (stores the source path in clipboard)
func Cut(sourcePath string) error {
	// Verify the source exists
	if _, err := os.Stat(sourcePath); err != nil {
		return err
	}

	clipboard = &Clipboard{
		SourcePath: sourcePath,
		Operation:  "cut",
	}
	return nil
}

// Paste completes a cut or copy operation by moving/copying to targetPath
func Paste(targetPath string) error {
	if clipboard == nil {
		return fmt.Errorf("nothing to paste")
	}

	var err error
	if clipboard.Operation == "copy" {
		err = Copy(clipboard.SourcePath, targetPath)
	} else if clipboard.Operation == "cut" {
		// For cut operation, we copy first then delete the source
		err = Copy(clipboard.SourcePath, targetPath)
		if err == nil {
			err = Delete(clipboard.SourcePath)
		}
	}

	// Clear clipboard after paste operation
	clipboard = nil
	return err
}

// copyFile copies a single file from src to dst
func copyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	// Create destination directory if it doesn't exist
	destDir := filepath.Dir(dst)
	if err := os.MkdirAll(destDir, 0755); err != nil {
		return err
	}

	destFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, sourceFile)
	if err != nil {
		return err
	}

	// Copy file permissions
	sourceInfo, err := os.Stat(src)
	if err != nil {
		return err
	}
	return os.Chmod(dst, sourceInfo.Mode())
}

// copyDir recursively copies a directory from src to dst
func copyDir(src, dst string) error {
	sourceInfo, err := os.Stat(src)
	if err != nil {
		return err
	}

	// Create destination directory
	if err := os.MkdirAll(dst, sourceInfo.Mode()); err != nil {
		return err
	}

	entries, err := os.ReadDir(src)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		srcPath := filepath.Join(src, entry.Name())
		dstPath := filepath.Join(dst, entry.Name())

		if entry.IsDir() {
			if err := copyDir(srcPath, dstPath); err != nil {
				return err
			}
		} else {
			if err := copyFile(srcPath, dstPath); err != nil {
				return err
			}
		}
	}

	return nil
}
