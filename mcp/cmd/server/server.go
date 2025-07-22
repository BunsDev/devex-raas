package server

import (
	"context"

	"mcp/tools"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

type McpServer struct {
	server *mcp.Server
}

func NewMcpServer() *McpServer {

	server := mcp.NewServer(&mcp.Implementation{
		Name:    "DevEx MCP Server",
		Version: "v1.0.0",
	}, nil)

	mcp.AddTool(server, &mcp.Tool{
		Name:        "Ping",
		Description: "Ping the MCP Server",
	}, tools.Ping)

	return &McpServer{server: server}
}

func (m *McpServer) Run() error {
	return m.server.Run(context.Background(), mcp.NewStdioTransport())
}
