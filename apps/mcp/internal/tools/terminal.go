package tools

import (
	"context"
	"fmt"
	"packages/pb"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

type ExecuteCommandParams struct {
	Command    string `json:"command" jsonschema:"The command to execute"`
	WorkingDir string `json:"working_dir" jsonschema:"Working directory for the command (optional)"`
	Timeout    int    `json:"timeout" jsonschema:"Timeout in seconds (default: 30)"`
}

func (h *ToolsHandler) ExecuteCommand(ctx context.Context, ss *mcp.ServerSession, params *mcp.CallToolParamsFor[ExecuteCommandParams]) (*mcp.CallToolResultFor[any], error) {
	resp, err := h.replClient.Client.ExecuteCommand(ctx, &pb.ExecuteCommandRequest{
		Command:    params.Arguments.Command,
		WorkingDir: params.Arguments.WorkingDir,
		Timeout:    int32(params.Arguments.Timeout),
	})
	if err != nil {
		return &mcp.CallToolResultFor[any]{
			IsError: true,
			Content: []mcp.Content{&mcp.TextContent{
				Text: fmt.Sprintf("Failed to execute command: %v", err),
			}},
		}, nil
	}

	if resp.Error != "" {
		return &mcp.CallToolResultFor[any]{
			IsError: true,
			Content: []mcp.Content{&mcp.TextContent{
				Text: fmt.Sprintf("Error executing command: %s", resp.Error),
			}},
		}, nil
	}

	return &mcp.CallToolResultFor[any]{
		Content: []mcp.Content{&mcp.TextContent{
			Text: resp.Output,
		}},
	}, nil
}

type CreateTerminalParams struct {
	Name string `json:"name" jsonschema:"Name for the terminal session (optional)"`
}

func (h *ToolsHandler) CreateTerminal(ctx context.Context, ss *mcp.ServerSession, params *mcp.CallToolParamsFor[CreateTerminalParams]) (*mcp.CallToolResultFor[any], error) {
	resp, err := h.replClient.Client.CreateTerminal(ctx, &pb.CreateTerminalRequest{
		Name: params.Arguments.Name,
	})
	if err != nil {
		return &mcp.CallToolResultFor[any]{
			IsError: true,
			Content: []mcp.Content{&mcp.TextContent{
				Text: fmt.Sprintf("Failed to create terminal: %v", err),
			}},
		}, nil
	}

	if resp.Error != "" {
		return &mcp.CallToolResultFor[any]{
			IsError: true,
			Content: []mcp.Content{&mcp.TextContent{
				Text: fmt.Sprintf("Error creating terminal: %s", resp.Error),
			}},
		}, nil
	}

	return &mcp.CallToolResultFor[any]{
		Content: []mcp.Content{&mcp.TextContent{
			Text: fmt.Sprintf("Terminal created with session ID: %s", resp.SessionId),
		}},
	}, nil
}

type SendToTerminalParams struct {
	SessionID string `json:"session_id" jsonschema:"The terminal session ID"`
	Input     string `json:"input" jsonschema:"The input to send to the terminal"`
}

func (h *ToolsHandler) SendToTerminal(ctx context.Context, ss *mcp.ServerSession, params *mcp.CallToolParamsFor[SendToTerminalParams]) (*mcp.CallToolResultFor[any], error) {
	resp, err := h.replClient.Client.SendToTerminal(ctx, &pb.SendToTerminalRequest{
		SessionId: params.Arguments.SessionID,
		Input:     params.Arguments.Input,
	})
	return h.handleTerminalActionResponse(resp, err, "send to terminal")
}

type CloseTerminalParams struct {
	SessionID string `json:"session_id" jsonschema:"The terminal session ID"`
}

func (h *ToolsHandler) CloseTerminal(ctx context.Context, ss *mcp.ServerSession, params *mcp.CallToolParamsFor[CloseTerminalParams]) (*mcp.CallToolResultFor[any], error) {
	resp, err := h.replClient.Client.CloseTerminal(ctx, &pb.CloseTerminalRequest{
		SessionId: params.Arguments.SessionID,
	})
	return h.handleTerminalActionResponse(resp, err, "close terminal")
}
