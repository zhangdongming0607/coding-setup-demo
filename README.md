# Demo 聊天助手

编程入门课程的配套 Demo 项目。一个简单的聊天页面，用来学习前端/后端分离、DevTools 调试、代码阅读。

## 项目结构

```
├── client/                ← 前端代码（跑在浏览器里）
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx       ← 前端入口
│   │   ├── App.tsx        ← 根组件
│   │   ├── api.ts         ← 调后端的函数
│   │   └── components/    ← 页面组件
│   ├── vite.config.ts     ← 打包工具配置
│   └── tsconfig.json
│
├── server/                ← 后端代码（跑在服务器上）
│   ├── index.ts           ← 服务器入口
│   └── replies.ts         ← 回复规则
│
└── package.json
```

## 在线运行

点击下方按钮，无需安装任何环境：

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/zhangdongming0607/coding-setup-demo)

## 本地运行

```bash
npm install
npm run dev
```

打开 http://localhost:5173 即可使用。
