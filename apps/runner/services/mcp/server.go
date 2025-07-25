package mcp

import (
	"context"
	"fmt"
	"log"
	"net"
	"packages/pb"
	"runner/pkg/fs"

	"google.golang.org/grpc"
)

type grpcServer struct {
	pb.UnimplementedReplServiceServer
}

func NewGrpcServer(lis net.Listener) error {
	server := grpc.NewServer()
	pb.RegisterReplServiceServer(server, &grpcServer{})

	log.Println("Starting gRPC server on :50051")
	return server.Serve(lis)
}

func (s *grpcServer) FetchContent(ctx context.Context, in *pb.FetchContentRequest) (*pb.FetchContentResponse, error) {

	fullPath := fmt.Sprintf("/workspaces/%s", in.Path)
	data, err := fs.FetchFileContent(fullPath)
	if err != nil {
		log.Printf("Error fetching file content: %v", err)
		return nil, err
	}

	return &pb.FetchContentResponse{
		Content: data,
	}, nil

}
