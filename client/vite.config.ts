import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";

/*
 * ↓ 回复规则来自 server/replies.ts（这里复制一份给 Vite 插件用）
 *   保留 server/ 目录是为了演示"前后端分离"的项目结构
 */

interface ReplyRule {
  keywords: string[];
  reply: string;
}

const rules: ReplyRule[] = [
  { keywords: ["你好", "hi", "hello", "嗨"], reply: "你好呀！很高兴见到你，有什么想聊的吗？" },
  { keywords: ["名字", "你是谁", "你叫什么"], reply: "我是 Demo 助手，一个用来教学的简单聊天机器人。我的代码就在这个项目里，你可以打开看看我是怎么工作的！" },
  { keywords: ["天气"], reply: "我没有联网功能，查不了天气哦。不过你可以打开 DevTools 的 Network 面板，看看我们之间的请求长什么样！" },
  { keywords: ["代码", "编程", "开发"], reply: "说到代码，你现在看到的这个聊天页面就是用 React 写的前端 + Express 写的后端。前端跑在浏览器里，后端跑在你的电脑上。" },
  { keywords: ["前端", "浏览器"], reply: "前端代码在 client/ 文件夹里，它们会被发送到浏览器执行。你可以在 DevTools 的 Elements 面板里看到它们生成的 HTML。" },
  { keywords: ["后端", "服务器", "server"], reply: "后端代码在 server/ 文件夹里，它跑在你的电脑上（就是那个终端窗口里）。浏览器通过 HTTP 请求跟它通信。" },
  { keywords: ["api", "接口", "请求"], reply: "每次你发消息，前端都会发一个 POST 请求到 /api/chat。你可以在 Network 面板里看到这个请求的详细信息——包括你发了什么、我回了什么。" },
  { keywords: ["谢谢", "感谢", "thanks"], reply: "不客气！继续探索吧，试试打开 DevTools 看看我们之间的通信过程。" },
];

const genericReplies: string[] = [
  "有意思！你可以试试打开 Chrome DevTools（按 F12），看看 Network 面板里我们的对话请求。",
  "收到！顺便说一句，你发的每条消息都是一个 HTTP 请求，后端收到后再返回我的回复。",
  "好的！你知道吗，这个页面的 HTML 结构可以在 DevTools 的 Elements 面板里看到。",
  "嗯嗯！试试在 Console 面板里输入 document.title，看看会返回什么？",
  "我听到了！这条回复是从后端服务器返回的 JSON 数据，前端把它渲染成了你看到的气泡样式。",
];

function getReply(userMessage: string): string {
  const msg = userMessage.toLowerCase();
  for (const rule of rules) {
    if (rule.keywords.some((kw) => msg.includes(kw))) {
      return rule.reply;
    }
  }
  return genericReplies[Math.floor(Math.random() * genericReplies.length)];
}

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
