module runner

go 1.24.5

require (
	github.com/creack/pty v1.1.24
	github.com/gorilla/websocket v1.5.3
	github.com/rs/cors v1.11.1
	github.com/sergi/go-diff v1.4.0
	google.golang.org/grpc v1.74.2
	packages v0.0.0
)

require (
	golang.org/x/net v0.40.0 // indirect
	golang.org/x/sys v0.33.0 // indirect
	golang.org/x/text v0.25.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20250528174236-200df99c418a // indirect
	google.golang.org/protobuf v1.36.6 // indirect
)

replace packages => ../../packages
