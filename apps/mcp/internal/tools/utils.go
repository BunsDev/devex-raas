package tools

import "mcp/internal/gRPC"

type ToolsHandler struct {
	replClient *gRPC.ReplClient
}

func NewToolsHandler(c *gRPC.ReplClient) *ToolsHandler {
	return &ToolsHandler{
		replClient: c,
	}
}
