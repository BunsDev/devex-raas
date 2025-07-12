const http = require("http");
const port = 5000;

const server = http.createServer((req, res) => {
  if (req.path == "/ping") {
    res.writeHead(200, { "Content-Type": "application/json" });

    const responseObject = {
      success: true,
      message: "pong",
    };

    res.end(JSON.stringify(responseObject));
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(
    JSON.stringify({
      success: true,
      message: "Winter is Coming",
    }),
  );
});

server.listen(port, () => {
  console.log("Server running on port: ", port);
});
