package tools

import (
	"context"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

func Ping(ctx context.Context, cc *mcp.ServerSession, params *mcp.CallToolParamsFor[mcp.PingParams]) (*mcp.CallToolResultFor[any], error) {

	return &mcp.CallToolResultFor[any]{
		Content: []mcp.Content{
			&mcp.TextContent{Text: "hello world"},
		},
	}, nil

}
