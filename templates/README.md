# 🧩 Adding Starter Templates to Devex

Devex allows users to spin up containerized REPL environments using predefined templates. To contribute your own starter template, follow the steps below.

> 📄 **Before You Begin**
> Make sure to read the [Contribution Guide](./CONTRIBUTING.md) at the root of the repo before proceeding.

---

## 🚀 Steps to Add a New Template

### ✅ Step 1: Add Template Folder in `templates/`

* Create a new folder inside `templates/`.
* This folder name will act as the **template key** and must:

  * Be unique.
  * Be URL-friendly (use `-` instead of spaces).
  * Match exactly across all usages (`templates`, `runner`, `web`, `core`).
  * Be below 8MB in size.

> Example: For a template named `node`, create `templates/node/`.

---

### ⚙️ Step 2: Add a Dockerfile in `runner/`

* Create a Dockerfile in `runner/` named `<template-key>.dockerfile`.

> Example: For a `node` template:
> Create `runner/node.dockerfile`

#### 🔧 Sample Dockerfile

```Dockerfile
# ---- Step 1: Build Stage ----
FROM golang:1.24 AS builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod tidy

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o runner ./cmd/main.go

# ---- Step 2: Final Runtime Stage ----
FROM node:20-slim
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    bash \
    curl \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

RUN npm install -g nodemon typescript ts-node

RUN curl -sS https://starship.rs/install.sh | sh -s -- -y && \
    echo 'eval "$(starship init bash)"' >> /root/.bashrc

COPY --from=builder /app/runner .

EXPOSE 8080
CMD ["/app/runner"]
```

> 🚫 **Note**: Do **not** modify the Go runner source code.
>
> 💡 Add any static files needed by your template inside `templates/<template-key>/`.

---

### 🧠 Step 3: Register the Template in the Web UI

Edit `web/libs/templates.tsx` and register your new template:

```tsx
node: {
  key: "node",
  name: "Node.js",
  description: "JavaScript runtime environment",
  icon: (
    <IconBrandNodejs className="bg-green-800 h-9 w-9 p-2 rounded-full" />
  ),
},
```

> 🧩 The `key` must match the template folder and Dockerfile name exactly.

---

### 🛡 Step 4: Add Template to Whitelist in Backend

Edit `core/models/template.go` and add your template under the allowed list:

```go
"node": {
	BaseImage: "node:20-slim",
	Port:      8081,
},
```

> 🔐 This step ensures only validated templates are accepted by the backend.

---

## 📝 Final Notes

* **Do not** change the core Go runner logic.
* Keep Dockerfiles lean and efficient.
* Use only required dependencies in each template.
* Avoid hardcoding secrets or large assets directly in the template.

---

## 📦 Example Template Keys

Here are a few examples of existing or recommended template keys:

| Key      | Description                  |
| -------- | ---------------------------- |
| `node`   | Node.js runtime with ts-node |
| `go`     | Go CLI tool template         |
| `python` | Python script environment    |

---

## 🙌 Contributing

We welcome all contributions to Devex! Please read the [Contribution Guide](./CONTRIBUTING.md) and follow the steps above when adding new templates.
