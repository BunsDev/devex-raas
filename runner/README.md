# 🏃 Runner Service – REPL Runtime Engine

The `runner/` service is the runtime component of the Devex platform.

It is a **lightweight WebSocket server** embedded inside the user’s REPL pod. The runner connects directly to the frontend, allowing real-time:

- File browsing and editing
- Terminal interaction via PTY
- Bi-directional event-driven communication

---

## 📁 Directory Structure

| Path                            | Description                                       |
|---------------------------------|---------------------------------------------------|
| [`cmd/`](./cmd)                 | Entrypoint and route setup                        |
| [`services/repl/route.go`](https://github.com/ParthKapoor-dev/devex/blob/main/runner/services/repl/route.go) | WebSocket endpoint handler                       |
| [`pkg/ws`](./pkg/ws)           | WebSocket abstraction and event routing layer     |
| [`pkg/fs`](./pkg/fs)           | Filesystem utils: read directory, patch files     |
| [`pkg/pty`](./pkg/pty)         | Terminal session manager using PTY                |

---

## 🌐 API Endpoint

### `GET /api/v1/repl/ws`

Defined in [`route.go`](https://github.com/ParthKapoor-dev/devex/blob/main/runner/services/repl/route.go), this WebSocket endpoint serves as the **main connection point** between the frontend and the REPL container.

---

## 🔄 WebSocket Event Flow

The WebSocket connection is **event-based**, using custom handlers via the [`pkg/ws`](./pkg/ws) system.

Here’s how each event is handled inside the runner:

---

### 📡 `Connection`

- **Triggered:** When the frontend successfully connects
- **Action:** Emits the `Loaded` event with the directory tree at `/workspaces`

```go
ws.On("Connection", func(data any) {
  rootContents, _ := fs.FetchDir("/workspaces", "")
  ws.Emit("Loaded", map[string]any{
    "rootContents": rootContents,
  })
})
````

---

### 📁 `fetchDir`

* **Purpose:** Fetches the contents of a directory (files & subfolders)
* **Payload:**

  ```json
  {
    "dir": "subdir/path"
  }
  ```
* **Emits:** `fetchDirResponse` with folder contents

```go
ws.Emit("fetchDirResponse", {
  "contents": [...],
  "path": "subdir/path"
})
```

---

### 📄 `fetchContent`

* **Purpose:** Fetches the content of a single file
* **Payload:**

  ```json
  {
    "path": "index.js"
  }
  ```
* **Emits:** `fetchContentResponse` with file content or error

---

### 💾 `updateContent`

* **Purpose:** Applies a patch to a file (diff-based updates)
* **Payload:**

  ```json
  {
    "path": "index.js",
    "patch": [...]
  }
  ```
* **Emits:** `updateContentResponse` with success or error

---

### 🖥️ `requestTerminal`

* **Purpose:** Starts a new PTY terminal session for the user
* **Flow:**

  1. A session is created using `pty.CreateSession`
  2. On receiving terminal data, it emits `terminalResponse`
  3. On close, emits `terminalClosed`

```go
session.SetOnDataCallback(func(data []byte) {
  ws.Emit("terminalResponse", string(data))
})
```

---

### ⌨️ `terminalInput`

* **Purpose:** Sends user input to the terminal session
* **Payload:**

  ```json
  {
    "data": "ls -la\n"
  }
  ```

---

## 🧱 Internal Packages

Each major functionality is implemented in modular packages. See individual documentation for detailed internals:

### [`pkg/ws`](./pkg/ws)

**WebSocket handler with event routing system**
Handles `On`, `Emit`, custom event types, and JSON marshalling.

📄 [View docs → `pkg/ws/README.md`](./pkg/ws/README.md)

---

### [`pkg/fs`](./pkg/fs)

**Filesystem abstraction layer**
Supports reading directories, fetching files, and applying patches.

📄 [View docs → `pkg/fs/README.md`](./pkg/fs/README.md)

---

### [`pkg/pty`](./pkg/pty)

**Terminal session manager using PTY**
Manages session creation, input, data output, and session lifecycle.

📄 [View docs → `pkg/pty/README.md`](./pkg/pty/README.md)

---

## 🧪 Runtime Environment

The runner is deployed inside each user’s REPL pod via Kubernetes, and interacts with the user-specific volume mounted at `/workspaces`.

* Runner container is built from the main Dockerfile
* Connects automatically with the frontend once the pod is ready
* Exposes internal REST/WebSocket interface at `/api/v1/repl/ws`

---

## 🧩 Responsibilities

| Task                     | Handled by               |
| ------------------------ | ------------------------ |
| Serve WebSocket Endpoint | `services/repl/route.go` |
| Emit & Handle Events     | `pkg/ws`                 |
| File operations          | `pkg/fs`                 |
| Terminal session         | `pkg/pty`                |

---

## 🔧 Future Improvements

* Add support for file uploads and deletions
* Terminal resize support
* Rate limiting or sandbox enforcement per session

---

## 🔗 Related

* Main backend API: [`/core`](../../core)
* Kubernetes setup: [`/k8s`](../../k8s)
* Templates used at REPL creation: [`/templates`](../../templates)

---
