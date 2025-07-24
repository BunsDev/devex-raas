# 🚀 DevEx MCP Server

Use Model Context Protocol (MCP) to plug AI assistants (like Gemini, Claude, or ChatGPT) into your DevEx REPL sessions.

---

## 🧪 Test Locally with MCP Inspector

1. Make sure your DevEx MCP server is running (inside your runner pod or standalone).

2. From your terminal, run:

   ```bash
   npx @modelcontextprotocol/inspector node path/to/devex-mcp-server
   ```

This does two things:

* Starts the Inspector UI at **[http://localhost:6274](http://localhost:6274)**
* Proxies requests to your MCP server at **localhost:6277**

3. Open your browser and visit **[http://localhost:6274](http://localhost:6274)**. You’ll see the MCP Inspector interface.

---

## 🔍 What You Can Test

* **Tool List** — Verify your MCP-exposed tools (e.g., `readFile`, `runCommand`)
* **Run Tools** — Manually invoke tools to test file access, terminal commands, etc.
* **Logs & Errors** — See real-time logs from your MCP server

---

## 🛠️ Once set up, you’re ready to:

* Connect real AI assistants via MCP (e.g. Claude Desktop, Cursor, ChatGPT with tool support)
* Build AI-powered REPL helpers inside DevEx
* Automate tests or workflows interacting with live REPLs

---

## ✅ Summary

* ✅ Start your MCP server
* ✅ Run Inspector with `npx @modelcontextprotocol/inspector`
* ✅ Open the browser UI and test your tools

No extra installs required—debug your AI integration in seconds!

---

## 👉 Learn more:

* [MCP Inspector Docs](https://modelcontextprotocol.io/docs/tools/inspector)
* [DevEx GitHub](https://github.com/parthkapoor-dev/devex)

Happy building! 💡
