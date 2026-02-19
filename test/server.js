#!/usr/bin/env node

/**
 * Simple development server for testing the webring widget
 * Usage: node test/server.js
 */

import { createServer } from "http";
import { readFileSync } from "fs";
import { resolve, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(import.meta.url);
const testDir = resolve(__dirname, "..");
const port = 3000;

const mimeTypes = {
  ".html": "text/html",
  ".htm": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain",
  ".map": "application/json",
};

const server = createServer((req, res) => {
  // Remove query string from URL
  const url = req.url?.split("?")[0] || "/";

  // Route to index.html for root
  let filePath = testDir + (url === "/" ? "/index.html" : url);

  // Security check - prevent directory traversal
  if (!filePath.startsWith(testDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  // Get file extension
  const ext = extname(filePath);
  const contentType = mimeTypes[ext] || "application/octet-stream";

  try {
    const content = readFileSync(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") {
      // File not found - try serving index.html for SPA-style routing
      if (url !== "/" && !url.includes(".")) {
        try {
          const indexContent = readFileSync(testDir + "/index.html");
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(indexContent, "utf8");
          return;
        } catch (indexErr) {
          // Fall through to 404
        }
      }

      res.writeHead(404);
      res.end("Not Found");
    } else {
      res.writeHead(500);
      res.end("Server Error");
    }
  }
});

server.listen(port, () => {
  console.log(`🚀 Webring Widget Test Server running at http://localhost:${port}`);
  console.log("📁 Serving files from:", testDir);
  console.log("🔗 Open http://localhost:3000 in your browser");
  console.log("⏹️  Press Ctrl+C to stop the server");
});

// Handle Ctrl+C gracefully
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down server...");
  server.close(() => {
    console.log("✅ Server stopped");
    process.exit(0);
  });
});
