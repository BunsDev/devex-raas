# ☁️ DEVEX — Minimal REPL-as-a-Service

A cloud-based code sandbox that creates isolated REPL environments for each user. Inspired by Replit, built from the ground up using **Go**, **Kubernetes**, and **Next.js**.

---

## 🧠 Project Architecture

This project has three major components:

### 1. 🧩 Frontend (`Next.js`)
- Built as a clean sandboxing environment.
- Contains:
  - 📝 Code editor
  - 📂 Sidebar (file structure)
  - 💻 Terminal
  - 🚀 Output section

#### ✅ Done
- Basic sandbox page UI setup

#### 🛠️ Pending
- [ ] WebSocket connection to runner container
- [ ] Fetch/save files to container
- [ ] Handle terminal events
- [ ] User Authentication
- [ ] Create new REPL project from frontend

---

### 2. ⚙️ Core Backend (`Go`)
- Handles orchestration of new runner pods on Kubernetes.
- Will handle authentication and DB interaction later.

#### ✅ Done
- Basic Go HTTP server using `net/http`

#### 🛠️ Pending
- [ ] Implement REPL lifecycle:
  - [ ] Create new K8s deployment + service
  - [ ] Add Ingress route
- [ ] Add delayed shutdown logic (cleanup after idle)
- [ ] S3 Sync before shutdown
- [ ] Authentication & Authorization
- [ ] Database integration (project metadata)

---

### 3. 🧪 Runner Service (`Go or Node`)
- Handles real-time code execution and communication with the frontend.

This consists of **two microservices**:
- `proxy`: handles WebSocket, S3, and internal logic
- `runner`: isolated user container that only runs user code

#### 🛠️ Pending
- [ ] Design container separation (proxy ↔ runner)
- [ ] Terminal using `node-pty` or Go PTY
- [ ] Send/receive file diffs instead of entire content
- [ ] Secure sandboxing (user should not access proxy code)

---

## 🧪 Tests

- [ ] Unit tests (backend)
- [ ] Integration tests (runner ↔ frontend)
- [ ] E2E tests for REPL creation and execution

---

## 🚀 Deployment Plan

### Local Dev Setup
- Use [`minikube`](https://minikube.sigs.k8s.io/) or [`kind`](https://kind.sigs.k8s.io/) for testing Kubernetes locally
- Forward ports to access services
- Use mock S3 like `MinIO` locally

### Deployment Targets
| Component        | Platform        |
|------------------|-----------------|
| Core Backend     | VPS (e.g. Hetzner, Linode) |
| Frontend         | Vercel          |
| Runner + K8s     | Cloud Cluster (e.g. Civo, GKE) |

---

## 📂 Directory Structure (WIP)

```

.
├── frontend/           # Next.js sandbox UI
├── core-backend/       # Orchestration API in Go
│   ├── cmd/
│   │   ├── api/
│   │   └── main.go
│   └── services/
├── runner-service/     # WebSocket proxy + execution
│   ├── proxy/
│   └── runner/
├── k8s/                # YAML configs for deployment
└── README.md

```

---

## 💡 Future Enhancements
- GitHub login and repo cloning
- Live collaboration via WebRTC
- Project autosave with versioning
- File sharing via public REPL links

---

## 🧑‍💻 Contributors

- Parth Kapoor – Fullstack + Infra + Architect
- You! (feel free to open a PR 😉)

---

## 📬 Contact

For help, suggestions, or bugs: [@parthkapoor08](https://linkedin.com/in/parthkapoor08)

---
