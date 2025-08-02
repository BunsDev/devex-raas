# 🚀 Deploying Core Service with Docker Swarm

The `core/` backend service is deployed on a **self-managed VPS** using **Docker Swarm** — a lightweight alternative to Kubernetes.

This guide explains the rationale, setup steps, and deployment process using `docker stack`.

---

## 🧠 Why Docker Swarm?

While Kubernetes is a full-featured orchestration system, it's often overkill for small-scale or single-node production apps.

**Docker Swarm** was chosen because:

- ⚡ Lightweight and simple
- 💸 Lower resource usage than Kubernetes
- 🌐 Easily deployable on a single VPS
- 🔁 Supports rolling updates, blue-green deployment, and automatic rollback
- 🧱 Uses `docker stack` — similar to `docker-compose` but production-ready

---

## 📦 VPS Setup

Before deploying, we followed secure VPS setup practices including:

- SSH hardening
- Firewall setup
- User creation with limited privileges

📄 Refer to this guide:
[zenstats VPS Setup Docs](https://github.com/dreamsofcode-io/zenstats/blob/main/docs/vps-setup.md)

---

## 🐳 Docker Swarm Deployment Steps

### 1️⃣ Add Docker Context

Using `docker context`, you can run remote Docker commands from your local machine:

```bash
docker context create devx --docker "host=ssh://parth@api.devx.parthkapoor.me"
docker context use devx
````

You can now use Docker CLI commands on the VPS as if running locally.

---

### 2️⃣ Initialize Swarm

On your main manager node (your VPS):

```bash
docker swarm init
```

> ℹ️ If you want to add more nodes, Docker will provide a token and command to join them.

---

### 3️⃣ Initialize Swarm

Add Secrets using docker secrets

```bash
docker secret create spaces_access_key ./secrets/spaces_access_key.txt
docker secret create spaces_secret_key ./secrets/spaces_secret_key.txt
docker secret create redis_url ./secrets/redis_url.txt
docker secret create github_client_id ./secrets/github_client_id.txt
docker secret create github_client_secret ./secrets/github_client_secret.txt
docker secret create session_secret ./secrets/session_secret.txt
docker secret create kubeconfig_file ./secrets/kubeconfig.yaml
```

> ℹ️ If you want to add more nodes, Docker will provide a token and command to join them.

---

### 4️⃣ Deploy Stack

Deploy your service using the `docker-stack.yaml` file:

```bash
docker stack deploy -c docker-stack.yaml devex
```

This will spin up the defined services under the stack name `devex`.

---

### 5️⃣ Monitor Services

To list running services:

```bash
docker service ls
```

To inspect tasks of a specific service:

```bash
docker service ps devex_core
```

> Replace `core` with your specific service name from the `docker-stack.yaml`.

---

## 📄 Stack File: `docker-stack.yaml`

Your stack file describes:

* **Services** (e.g., `core`)
* **Volumes**
* **Environment variables**
* **Deployment strategies** (e.g., rolling updates)
* **Port mapping**
* **Secrets (optional)**

📄 [View full file → `apps/core/docker-stack.yaml`](https://github.com/ParthKapoor-dev/devex/blob/main/apps/core/docker-stack.yaml)

---

## ✅ Benefits of `docker stack` over `docker-compose`

| Feature                          | docker-compose | docker stack |
| -------------------------------- | -------------- | ------------ |
| Multi-host support               | ❌              | ✅            |
| Rolling updates                  | ❌              | ✅            |
| Health checks + restart policies | 🔄 Limited     | ✅            |
| Secrets + configs                | ✅ (limited)    | ✅            |
| Built-in orchestration           | ❌              | ✅            |
| Scalable replicas                | ❌              | ✅            |
| Auto rollback on failure         | ❌              | ✅            |

---

## 🧹 Cleanup

To remove the stack:

```bash
docker stack rm devex
```

To leave swarm mode:

```bash
docker swarm leave --force
```

---

## 📬 Notes

* You can deploy **multiple services** via `docker-stack.yaml`, and manage them together.
* Add load balancer (e.g., NGINX) if exposing to public internet with TLS (check [infra/k8s/cert-manager](../../infra/k8s) for ideas).
* Future enhancement: integrate with GitHub Actions for CI/CD to auto-deploy on push.

---
