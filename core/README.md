# 📘 Core Service – Devex Cloud IDE Backend

The `core/` service is the **main backend API server** responsible for:

- Handling GitHub OAuth2.0 login
- Managing REPL sessions and their lifecycles
- Creating & deleting Kubernetes workloads for REPLs
- Interacting with S3 and Redis

It is written in **Go** and designed as a lightweight API service for managing REPL infrastructure.

---

You can Checkout how this server is deployed at [`DEPLOYMENT`](./DEPLOYMENT.md).

---

## 📁 Directory Structure

| Path                              | Description                                      |
|-----------------------------------|--------------------------------------------------|
| [`cmd/`](./cmd)                   | Entry point, route definitions, middleware       |
| [`internal/k8s/`](./internal/k8s) | Kubernetes resource creation and cleanup         |
| [`internal/s3/`](./internal/s3)   | S3 file operations                               |
| [`internal/redis/`](./internal/redis) | Redis store logic                          |
| [`services/auth/github`](./services/auth/github) | GitHub OAuth2.0 login handler          |
| [`services/repl/`](./services/repl) | REPL session routes and logic                   |
| [`models/`](./models)             | Shared data structures for REPLs and Auth        |
| [`pkg/`](./pkg)                   | Utilities like JSON and env file loading         |

---

## 🌐 API Endpoints

### `POST /auth/github`

**Path**: [`services/auth/github/`](https://github.com/ParthKapoor-dev/devex/blob/main/core/services/auth/github)
**Handler**: [`handler.go`](https://github.com/ParthKapoor-dev/devex/blob/main/core/services/auth/github/handler.go)

Handles GitHub OAuth2.0 login. After successful login, the user session is managed via cookies or JWT.

---

### `POST /api/repl/...` (Protected Route)

**Path**: [`services/repl/route.go`](https://github.com/ParthKapoor-dev/devex/blob/main/core/services/repl/route.go)

These routes require a valid authenticated user session.

#### Protected via Middleware
**Middleware**: [`cmd/middleware/middleware.go`](https://github.com/ParthKapoor-dev/devex/blob/main/core/cmd/middleware/middleware.go)

The middleware verifies the user's session using cookies or headers, and passes the request if authenticated.

---

## 🧠 Core Concepts

### 🗃️ S3 – Code Storage

All REPL files are stored in S3 under:

```

username/repl-id/

```

On REPL creation:
- A folder is created
- Template files are copied from the [`/templates`](../../templates) directory

**Code Reference**:
[`internal/s3/s3.go`](https://github.com/ParthKapoor-dev/devex/blob/main/core/internal/s3/s3.go)

---

### ☸️ Kubernetes – Dynamic REPLs

When a REPL is started, the backend dynamically creates:

1. A **Deployment**
2. A **Service**
3. An **Ingress**

These allow the user to access their running REPL via:

```

[https://repl.parthkapoor.me/repl-id/](https://repl.parthkapoor.me/repl-id/)<subpath>

```

#### REPL Creation Logic
- Files are pulled from S3 via an **InitContainer**
- The **main container** (Runner) connects to frontend over WebSocket

📁 Code:
- [Create REPL](https://github.com/ParthKapoor-dev/devex/blob/main/core/internal/k8s/create.go)
- [Ingress setup](https://github.com/ParthKapoor-dev/devex/blob/main/core/internal/k8s/create.go#L50)

#### REPL Deletion Logic
When a REPL session ends:
- An **ephemeral container** is injected into the pod
- Files are pushed back to S3
- The **Deployment**, **Service**, and **Ingress** are deleted

📁 Code:
- [Delete REPL](https://github.com/ParthKapoor-dev/devex/blob/main/core/internal/k8s/delete.go)

---

### 💾 Redis – In-memory Session State

We use Redis as a lightweight store to manage:

- `activeSession:{replId}` → user’s active REPL session
- `userRepls:{userId}` → all REPL IDs owned by the user
- `replMeta:{replId}` → metadata like name, template, etc.

No traditional SQL DB is needed as:
- User data comes directly from GitHub
- Code is stored in S3

📁 Redis Store Logic:
[`internal/redis/store.go`](https://github.com/ParthKapoor-dev/devex/blob/main/core/internal/redis/store.go)

---

## 🔧 Internal Utilities

| Path | Purpose |
|------|---------|
| [`cmd/api/api.go`](https://github.com/ParthKapoor-dev/devex/blob/main/core/cmd/api/api.go) | Sets up the routes and API server |
| [`cmd/middleware/middleware.go`](https://github.com/ParthKapoor-dev/devex/blob/main/core/cmd/middleware/middleware.go) | Middleware for session protection |
| [`models/repl.go`](https://github.com/ParthKapoor-dev/devex/blob/main/core/models/repl.go) | REPL struct used across the app |
| [`pkg/dotenv/env.go`](https://github.com/ParthKapoor-dev/devex/blob/main/core/pkg/dotenv/env.go) | Loads environment variables |
| [`pkg/json/json.go`](https://github.com/ParthKapoor-dev/devex/blob/main/core/pkg/json/json.go) | JSON encoder/decoder helpers |

---

## 🧪 Sample Flow

1. User logs in via `/auth/github`
2. Frontend calls `/api/repl/create` with template + name
3. Backend:
   - Creates S3 folder and copies template files
   - Creates K8s Deployment + Service + Ingress
   - Returns access path
4. User writes code, interacts via WebSocket
5. On close:
   - Ephemeral container syncs files → S3
   - K8s resources cleaned up

---

## 📦 Future Improvements

- Add metrics and logging
- Add support for multiple languages and templates
- Optional: move metadata from Redis to Postgres

---

## 🧭 Next Docs

👉 Want to understand how the REPL container works? Check out the [`runner/`](../../runner) docs.

Need help setting up the cluster? Head to [`k8s/`](../../k8s).

---
