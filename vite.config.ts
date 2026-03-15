import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { getReply } from "./server/replies.js";

/**
 * Vite 插件：把后端 API 路由直接挂到 Vite 开发服务器上
 * 这样只需要一个端口，StackBlitz 等在线环境也能正常运行
 */
function apiPlugin(): Plugin {
  interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }

  const chatHistory: Message[] = [];

  return {
    name: "api-server",
    configureServer(server) {
      server.middlewares.use("/api/welcome", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({
          message: "你好！我是 Demo 助手，有什么可以帮你的？",
        }));
      });

      server.middlewares.use("/api/chat", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        let body = "";
        req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
        req.on("end", () => {
          const { message } = JSON.parse(body) as { message: string };

          if (!message || message.trim() === "") {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "消息不能为空" }));
            return;
          }

          if (message.includes("错误") || message.toLowerCase().includes("error")) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "服务器内部错误", detail: "这是一个故意制造的错误！" }));
            return;
          }

          if (message.includes("超时") || message.toLowerCase().includes("timeout")) {
            return; // 故意不响应
          }

          const reply = getReply(message);
          const now = new Date().toISOString();

          chatHistory.push({ role: "user", content: message, timestamp: now });
          chatHistory.push({ role: "assistant", content: reply, timestamp: now });

          setTimeout(() => {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ reply, timestamp: now }));
          }, 500);
        });
      });

      server.middlewares.use("/api/history", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ messages: chatHistory }));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiPlugin()],
});
