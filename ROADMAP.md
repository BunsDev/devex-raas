# 🛣️ DevEx Roadmap

Welcome to the official **DevEx** roadmap! This document outlines the upcoming features and improvements we’re working on or planning to build. Contributions and suggestions are **highly welcome** — check out our [GitHub repo](https://github.com/parthkapoor-dev/devex) to get involved.

> 💡 DevEx is an open-source, cloud-based IDE like Replit — but built for hackers, contributors, and learners.

---

## ✅ Current Focus

These are the features that are either **being built** or planned for the near future:

---

### 🧠 1. MCP Server — AI Assistant in the REPL
**Level:** Medium
**Goal:** Enable users to interact with their REPL session using an AI assistant (e.g., Gemini, Claude).

**Overview:**
- We'll introduce a **Model Context Protocol (MCP)** server that runs alongside each REPL session in the Kubernetes pod.
- It will communicate with the REPL through internal APIs, allowing the assistant to access files, terminals, and logs.
- Shutdown Manager will also account for AI-activity (preventing idle shutdowns if AI is in use).
- Web UI and API documentation will be provided for full integration.

---

### 💻 2. DevEx CLI + SSH Access
**Level:** Medium
**Goal:** Give users the power to interact with their REPL directly from their terminal.

**Overview:**
- A lightweight DevEx CLI will allow users to create, manage, and connect to REPL sessions.
- **SSH access** will enable full terminal control — great for advanced workflows.
- The shutdown manager will be updated to handle active SSH sessions.
- Will include secure key management, SSH hardening, and simple installation docs.

---

### 🔐 3. GitHub Integration for Project Bootstrapping
**Level:** Easy
**Goal:** Let users start REPL sessions from their own GitHub repos instead of templates.

**Overview:**
- Migrate from OAuth to GitHub Apps for authentication.
- Add UI and API flow to import a GitHub repo directly into the REPL session.
- Use GitHub API to clone and sync projects.

---

### 🧪 4. AI Code Sandboxing (Experimental)
**Level:** Medium
**Goal:** Safely test AI-generated code inside REPLs **before integrating into real apps**.

**Overview:**
- This feature is **distinct from the MCP server**. While MCP provides assistant interaction, sandboxing focuses on **previewing** AI-made changes.
- AI will edit a session sandbox; users can then **test the app live via a shareable preview URL**.
- If happy with the changes, users can manually merge or discard them.
- This ensures experimentation without compromising your main app logic.

---

## 📅 Future Ideas (Not Yet Prioritized)
These are potential features we’d love to explore in the future:
- Multi-user real-time collaboration
- Persistent filesystem (bind storage volumes)
- Workspace Templates from community
- Plugin system for language/runtimes
- Built-in secrets manager for REPLs

---

## 🙌 Want to Contribute?

We’d love your help — from fixing bugs to building features or designing templates!
Check out:

📘 [Issues](https://github.com/parthkapoor-dev/devex/issues)
🚀 [Contribute Guide](https://github.com/parthkapoor-dev/devex/blob/main/CONTRIBUTING.md)
🌐 Live: [devx.parthkapoor.me](https://devx.parthkapoor.me)

---

> 🧑‍💻 Built by [Parth Kapoor](https://parthkapoor.me) — Let's build the next-gen cloud dev experience together!
```
