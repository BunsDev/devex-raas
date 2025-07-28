package tools

import (
	"fmt"
	"mcp/internal/gRPC"
	"packages/pb"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

type ToolsHandler struct {
	replClient *gRPC.ReplClient
}

func NewToolsHandler(c *gRPC.ReplClient) *ToolsHandler {
	return &ToolsHandler{
		replClient: c,
	}
}

func (h *ToolsHandler) handleFileActionResponse(resp *pb.FileActionResponse, err error, action string) (*mcp.CallToolResultFor[any], error) {
	if err != nil {
		return &mcp.CallToolResultFor[any]{
			IsError: true,
			Content: []mcp.Content{&mcp.TextContent{
				Text: fmt.Sprintf("Failed to %s: %v", action, err),
			}},
		}, nil
	}

	if !resp.Success {
		return &mcp.CallToolResultFor[any]{
			IsError: true,
			Content: []mcp.Content{&mcp.TextContent{
				Text: fmt.Sprintf("Error %s: %s", action, resp.Error),
			}},
		}, nil
	}

	return &mcp.CallToolResultFor[any]{
		Content: []mcp.Content{&mcp.TextContent{
			Text: fmt.Sprintf("Successfully %sed", action),
		}},
	}, nil
}

func (h *ToolsHandler) handleTerminalActionResponse(resp *pb.TerminalActionResponse, err error, action string) (*mcp.CallToolResultFor[any], error) {
	if err != nil {
		return &mcp.CallToolResultFor[any]{
			IsError: true,
			Content: []mcp.Content{&mcp.TextContent{
				Text: fmt.Sprintf("Failed to %s: %v", action, err),
			}},
		}, nil
	}

	if !resp.Success {
		return &mcp.CallToolResultFor[any]{
			IsError: true,
			Content: []mcp.Content{&mcp.TextContent{
				Text: fmt.Sprintf("Error %s: %s", action, resp.Error),
			}},
		}, nil
	}

	return &mcp.CallToolResultFor[any]{
		Content: []mcp.Content{&mcp.TextContent{
			Text: fmt.Sprintf("Successfully %sed", action),
		}},
	}, nil
}