package server

import (
	"log"
	"mcp/internal/gRPC"
	"mcp/internal/tools"
	"net/http"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

type McpServer struct {
	server     *mcp.Server
	replClient *gRPC.ReplClient
	tools      *tools.ToolsHandler
	httpAddr   string
}

func NewMcpServer() *McpServer {

	defer log.Println("Created a New Server Instance")

	server := mcp.NewServer(&mcp.Implementation{
		Name:    "DevEx MCP Server",
		Version: "v1.0.0",
	}, nil)

	replClient, err := gRPC.NewReplClient()
	if err != nil {
		log.Println("repl client error:", err)
	}

	tools := tools.NewToolsHandler(replClient)

	mcp.AddTool(server, &mcp.Tool{
		Name:        "Ping",
		Description: "Ping the MCP Server",
	}, tools.Ping)

	// File System Tools
	mcp.AddTool(server, &mcp.Tool{
		Name:        "read_file",
		Description: "Read the contents of a file in the workspace",
	}, tools.ReadFile)

	mcp.AddTool(server, &mcp.Tool{
		Name:        "write_file",
		Description: "Write content to a file in the workspace",
	}, tools.WriteFile)

	mcp.AddTool(server, &mcp.Tool{
		Name:        "list_files",
		Description: "List files and directories in a given path",
	}, tools.ListFiles)

	mcp.AddTool(server, &mcp.Tool{
		Name:        "create_file",
		Description: "Create a new file in the workspace",
	}, tools.CreateFile)

	mcp.AddTool(server, &mcp.Tool{
		Name:        "create_folder",
		Description: "Create a new folder in the workspace",
	}, tools.CreateFolder)

	mcp.AddTool(server, &mcp.Tool{
		Name:        "delete",
		Description: "Delete a file or folder from the workspace",
	}, tools.Delete)

	mcp.AddTool(server, &mcp.Tool{
		Name:        "rename",
		Description: "Rename or move a file or folder",
	}, tools.Rename)

	mcp.AddTool(server, &mcp.Tool{
		Name:        "copy",
		Description: "Copy a file or folder",
	}, tools.Copy)

	// Terminal Tools
	mcp.AddTool(server, &mcp.Tool{
		Name:        "execute_command",
		Description: "Execute a command in the terminal and return the output",
	}, tools.ExecuteCommand)

	mcp.AddTool(server, &mcp.Tool{
		Name:        "create_terminal",
		Description: "Create a new persistent terminal session",
	}, tools.CreateTerminal)

	mcp.AddTool(server, &mcp.Tool{
		Name:        "send_to_terminal",
		Description: "Send input to a persistent terminal session",
	}, tools.SendToTerminal)

	mcp.AddTool(server, &mcp.Tool{
		Name:        "close_terminal",
		Description: "Close a persistent terminal session",
	}, tools.CloseTerminal)

	return &McpServer{
		server:   server,
		tools:    tools,
		httpAddr: ":8080",
	}
}

func (m *McpServer) Run() error {
	log.Println("Running the MCP Server Now")
	defer log.Println("Shutting Down the MCP Server")

	handler := mcp.NewStreamableHTTPHandler(func(*http.Request) *mcp.Server {
		return m.server
	}, nil)

	http.ListenAndServe(m.httpAddr, handler)
	return nil
}
