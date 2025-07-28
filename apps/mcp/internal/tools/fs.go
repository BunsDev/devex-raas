package tools

import (
	"context"
	"fmt"
	"packages/pb"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

type ReadFileParams struct {
	Path string `json:"path" jsonschema:"The path to the file relative to workspace root"`
}

func (h *ToolsHandler) ReadFile(ctx context.Context, ss *mcp.ServerSession, params *mcp.CallToolParamsFor[ReadFileParams]) (*mcp.CallToolResultFor[any], error) {
	resp, err := h.replClient.Client.ReadFile(ctx, &pb.ReadFileRequest{
		Path: params.Arguments.Path,
	})
	if err != nil {
		return &mcp.CallToolResultFor[any]{
			IsError: true,
			Content: []mcp.Content{&mcp.TextContent{
				Text: fmt.Sprintf("Failed to read file: %v", err),
			}},
		}, nil
	}

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

type WriteFileParams struct {
	Path    string `json:"path" jsonschema:"The path to the file relative to workspace root"`
	Content string `json:"content" jsonschema:"The content to write to the file"`
}

func (h *ToolsHandler) WriteFile(ctx context.Context, ss *mcp.ServerSession, params *mcp.CallToolParamsFor[WriteFileParams]) (*mcp.CallToolResultFor[any], error) {
	resp, err := h.replClient.Client.WriteFile(ctx, &pb.WriteFileRequest{
		Path:    params.Arguments.Path,
		Content: params.Arguments.Content,
	})
	return h.handleFileActionResponse(resp, err, "write file")
}

type ListFilesParams struct {
	Path string `json:"path" jsonschema:"The path to list (empty for root)"`
}

func (h *ToolsHandler) ListFiles(ctx context.Context, ss *mcp.ServerSession, params *mcp.CallToolParamsFor[ListFilesParams]) (*mcp.CallToolResultFor[any], error) {
	resp, err := h.replClient.Client.ListFiles(ctx, &pb.ListFilesRequest{
		Path: params.Arguments.Path,
	})
	if err != nil {
		return &mcp.CallToolResultFor[any]{
			IsError: true,
			Content: []mcp.Content{&mcp.TextContent{
				Text: fmt.Sprintf("Failed to list files: %v", err),
			}},
		}, nil
	}

	if resp.Error != "" {
		return &mcp.CallToolResultFor[any]{
			IsError: true,
			Content: []mcp.Content{&mcp.TextContent{
				Text: fmt.Sprintf("Error listing files: %s", resp.Error),
			}},
		}, nil
	}

	// Format the file list into a readable string
	var fileList string
	for _, file := range resp.Files {
		fileType := "file"
		if file.IsDir {
			fileType = "dir"
		}
		fileList += fmt.Sprintf("%s\t\t%s\n", file.Name, fileType)
	}

	return &mcp.CallToolResultFor[any]{
		Content: []mcp.Content{&mcp.TextContent{
			Text: fileList,
		}},
	}, nil
}

type CreateFileParams struct {
	Path string `json:"path" jsonschema:"The path for the new file"`
}

func (h *ToolsHandler) CreateFile(ctx context.Context, ss *mcp.ServerSession, params *mcp.CallToolParamsFor[CreateFileParams]) (*mcp.CallToolResultFor[any], error) {
	resp, err := h.replClient.Client.CreateFile(ctx, &pb.CreateFileRequest{
		Path: params.Arguments.Path,
	})
	return h.handleFileActionResponse(resp, err, "create file")
}

type CreateFolderParams struct {
	Path string `json:"path" jsonschema:"The path for the new folder"`
}

func (h *ToolsHandler) CreateFolder(ctx context.Context, ss *mcp.ServerSession, params *mcp.CallToolParamsFor[CreateFolderParams]) (*mcp.CallToolResultFor[any], error) {
	resp, err := h.replClient.Client.CreateFolder(ctx, &pb.CreateFolderRequest{
		Path: params.Arguments.Path,
	})
	return h.handleFileActionResponse(resp, err, "create folder")
}

type DeleteParams struct {
	Path string `json:"path" jsonschema:"The path to delete"`
}

func (h *ToolsHandler) Delete(ctx context.Context, ss *mcp.ServerSession, params *mcp.CallToolParamsFor[DeleteParams]) (*mcp.CallToolResultFor[any], error) {
	resp, err := h.replClient.Client.Delete(ctx, &pb.DeleteRequest{
		Path: params.Arguments.Path,
	})
	return h.handleFileActionResponse(resp, err, "delete")
}

type RenameParams struct {
	OldPath string `json:"old_path" jsonschema:"The current path"`
	NewPath string `json:"new_path" jsonschema:"The new path"`
}

func (h *ToolsHandler) Rename(ctx context.Context, ss *mcp.ServerSession, params *mcp.CallToolParamsFor[RenameParams]) (*mcp.CallToolResultFor[any], error) {
	resp, err := h.replClient.Client.Rename(ctx, &pb.RenameRequest{
		OldPath: params.Arguments.OldPath,
		NewPath: params.Arguments.NewPath,
	})
	return h.handleFileActionResponse(resp, err, "rename")
}

type CopyParams struct {
	SourcePath string `json:"source_path" jsonschema:"The source path"`
	TargetPath string `json:"target_path" jsonschema:"The target path"`
}

func (h *ToolsHandler) Copy(ctx context.Context, ss *mcp.ServerSession, params *mcp.CallToolParamsFor[CopyParams]) (*mcp.CallToolResultFor[any], error) {
	resp, err := h.replClient.Client.Copy(ctx, &pb.CopyRequest{
		SourcePath: params.Arguments.SourcePath,
		TargetPath: params.Arguments.TargetPath,
	})
	return h.handleFileActionResponse(resp, err, "copy")
}
