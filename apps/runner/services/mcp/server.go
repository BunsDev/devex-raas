package mcp

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"
	"path/filepath"
	"runner/pkg/fs"
	"runner/pkg/pty"
	"strings"

	"packages/pb"

	"google.golang.org/grpc"
)

// Server is the gRPC server for the REPL service.
type Server struct {
	pb.UnimplementedReplServiceServer
	ptyManager *pty.PTYManager
}

// NewServer creates a new gRPC server.
func NewGrpcServer() *Server {
	return &Server{
		ptyManager: pty.GetPTYManager(),
	}
}

// Start starts the gRPC server on a given port.
func (s *Server) Start(port int) error {
	addr := fmt.Sprintf(":%d", port)
	lis, err := net.Listen("tcp", addr)
	if err != nil {
		return fmt.Errorf("failed to listen: %v", err)
	}

	grpcServer := grpc.NewServer()
	pb.RegisterReplServiceServer(grpcServer, s)

	log.Printf("gRPC server listening on %s", addr)
	return grpcServer.Serve(lis)
}

func (s *Server) ReadFile(ctx context.Context, req *pb.ReadFileRequest) (*pb.ReadFileResponse, error) {
	fullPath := getFullPath(req.Path)
	content, err := fs.FetchFileContent(fullPath)
	if err != nil {
		return &pb.ReadFileResponse{Error: err.Error()}, nil
	}
	return &pb.ReadFileResponse{Content: content}, nil
}

func (s *Server) WriteFile(ctx context.Context, req *pb.WriteFileRequest) (*pb.FileActionResponse, error) {
	fullPath := getFullPath(req.Path)
	if err := fs.SaveFile(fullPath, req.Content); err != nil {
		return &pb.FileActionResponse{Success: false, Error: err.Error()}, nil
	}
	return &pb.FileActionResponse{Success: true}, nil
}

func (s *Server) ListFiles(ctx context.Context, req *pb.ListFilesRequest) (*pb.ListFilesResponse, error) {
	contents, err := fs.FetchDir("/workspaces", req.Path)
	if err != nil {
		return &pb.ListFilesResponse{Error: err.Error()}, nil
	}

	var files []*pb.ListFilesResponse_FileInfo
	for _, f := range contents {
		files = append(files, &pb.ListFilesResponse_FileInfo{
			Name:  f.Name,
			IsDir: f.IsDir,
			// ModTime: f.ModTime.Unix(), // This needs to be fixed in fs.FetchDir
		})
	}

	return &pb.ListFilesResponse{Files: files}, nil
}

func (s *Server) CreateFile(ctx context.Context, req *pb.CreateFileRequest) (*pb.FileActionResponse, error) {
	fullPath := getFullPath(req.Path)
	if err := fs.CreateFile(fullPath); err != nil {
		return &pb.FileActionResponse{Success: false, Error: err.Error()}, nil
	}
	return &pb.FileActionResponse{Success: true}, nil
}

func (s *Server) CreateFolder(ctx context.Context, req *pb.CreateFolderRequest) (*pb.FileActionResponse, error) {
	fullPath := getFullPath(req.Path)
	if err := fs.CreateFolder(fullPath); err != nil {
		return &pb.FileActionResponse{Success: false, Error: err.Error()}, nil
	}
	return &pb.FileActionResponse{Success: true}, nil
}

func (s *Server) Delete(ctx context.Context, req *pb.DeleteRequest) (*pb.FileActionResponse, error) {
	fullPath := getFullPath(req.Path)
	if err := fs.Delete(fullPath); err != nil {
		return &pb.FileActionResponse{Success: false, Error: err.Error()}, nil
	}
	return &pb.FileActionResponse{Success: true}, nil
}

func (s *Server) Rename(ctx context.Context, req *pb.RenameRequest) (*pb.FileActionResponse, error) {
	oldFullPath := getFullPath(req.OldPath)
	newFullPath := getFullPath(req.NewPath)
	if err := fs.Rename(oldFullPath, newFullPath); err != nil {
		return &pb.FileActionResponse{Success: false, Error: err.Error()}, nil
	}
	return &pb.FileActionResponse{Success: true}, nil
}

func (s *Server) Copy(ctx context.Context, req *pb.CopyRequest) (*pb.FileActionResponse, error) {
	sourceFullPath := getFullPath(req.SourcePath)
	targetFullPath := getFullPath(req.TargetPath)
	if err := fs.Copy(sourceFullPath, targetFullPath); err != nil {
		return &pb.FileActionResponse{Success: false, Error: err.Error()}, nil
	}
	return &pb.FileActionResponse{Success: true}, nil
}

func (s *Server) ExecuteCommand(ctx context.Context, req *pb.ExecuteCommandRequest) (*pb.ExecuteCommandResponse, error) {
	// This is a simplified implementation. A real implementation would need to handle
	// timeouts, working directories, and streaming output.
	var output []string
	session, err := s.ptyManager.CreateSession(nil)
	if err != nil {
		return &pb.ExecuteCommandResponse{Error: err.Error()}, nil
	}
	defer session.Close()

	session.SetOnDataCallback(func(data []byte) {
		output = append(output, string(data))
	})

	session.WriteString(req.Command)

	// This is a blocking call and will wait for the command to finish.
	// A more robust solution would use a callback or channel.
	return &pb.ExecuteCommandResponse{Output: strings.Join(output, "")}, nil
}

func (s *Server) CreateTerminal(ctx context.Context, req *pb.CreateTerminalRequest) (*pb.CreateTerminalResponse, error) {
	sessionID := generateSessionID()
	_, err := s.ptyManager.CreateSession(nil)
	if err != nil {
		return &pb.CreateTerminalResponse{Error: err.Error()}, nil
	}
	return &pb.CreateTerminalResponse{SessionId: sessionID}, nil
}

func (s *Server) SendToTerminal(ctx context.Context, req *pb.SendToTerminalRequest) (*pb.TerminalActionResponse, error) {
	session, exists := s.ptyManager.GetSession(req.SessionId)
	if !exists {
		return &pb.TerminalActionResponse{Success: false, Error: "session not found"}, nil
	}
	session.WriteString(req.Input)
	return &pb.TerminalActionResponse{Success: true}, nil
}

func (s *Server) CloseTerminal(ctx context.Context, req *pb.CloseTerminalRequest) (*pb.TerminalActionResponse, error) {
	session, exists := s.ptyManager.GetSession(req.SessionId)
	if !exists {
		return &pb.TerminalActionResponse{Success: false, Error: "session not found"}, nil
	}
	session.Close()
	return &pb.TerminalActionResponse{Success: true}, nil
}

func getFullPath(relativePath string) string {
	return filepath.Join("/workspaces", relativePath)
}

func generateSessionID() string {
	// This is a placeholder. A real implementation should generate a unique ID.
	b := make([]byte, 16)
	_, err := os.Readlink("/dev/urandom")
	if err != nil {
		return ""
	}
	return fmt.Sprintf("%x", b)
}
