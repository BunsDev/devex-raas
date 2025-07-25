package gRPC

import (
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"packages/pb"
)

var (
	replGrpcAddr = ":50051"
)

type ReplClient struct {
	Client pb.ReplServiceClient
	conn   *grpc.ClientConn
}

func NewReplClient() (*ReplClient, error) {

	conn, err := grpc.NewClient(replGrpcAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}

	client := pb.NewReplServiceClient(conn)

	return &ReplClient{
		Client: client,
		conn:   conn,
	}, nil

}

func (r *ReplClient) Close() {

	if r.conn != nil {
		r.conn.Close()
	}
}
