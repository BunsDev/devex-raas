package tools

import (
	"context"
	"fmt"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

type ReadFileParams struct {
	Path string `json:"path" jsonschema:"The path to the file relative to workspace root"`
}

func (h *ToolsHandler) ReadFile(ctx context.Context, ss *mcp.ServerSession, params *mcp.CallToolParamsFor[ReadFileParams]) (*mcp.CallToolResultFor[any], error) {
	// resp, err := h.replClient.FetchContent(ctx, params.Arguments.Path)
	var resp struct {
		Content string
		Error   string
	}

	// if err != nil {
	// 	return &mcp.CallToolResultFor[any]{
	// 		IsError: true,
	// 		Content: []mcp.Content{&mcp.TextContent{
	// 			Text: fmt.Sprintf("Failed to read file: %v", err),
	// 		}},
	// 	}, nil
	// }

	if resp.Error != "" {
		return &mcp.CallToolResultFor[any]{
			IsError: true,
			Content: []mcp.Content{&mcp.TextContent{
				Text: fmt.Sprintf("Error reading file: %s", resp.Error),
			}},
		}, nil
	}

	return &mcp.CallToolResultFor[any]{
		Content: []mcp.Content{&mcp.TextContent{
			Text: resp.Content,
		}},
	}, nil
}
