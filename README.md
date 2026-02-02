# CodeTasker

从浏览器控制本地AI编程助手，支持任务队列管理和并发执行。

## 技术栈

- **前端**: Vue 3 + Vite + Element Plus + Pinia
- **后端**: Express.js + WebSocket (ws)
- **通信**: REST API + WebSocket 实时推送

## 功能特性

- 工作区选择（启动时用户自行选择目录）
- 任务队列管理（创建/编辑/删除/拖拽排序）
- 并发执行（设置并发数，自动按顺序执行）
- 实时终端输出（WebSocket推送）
- 任务数据持久化到工作区的 `code-tasks.json`

## 快速开始

### 1. 启动后端服务

```bash
cd backend
npm install
npm start
```

后端服务运行在 `http://localhost:3000`

### 2. 启动前端开发服务器

```bash
cd frontend
npm install
npm run dev
```

前端服务运行在 `http://localhost:5173`

### 3. 使用流程

1. 打开浏览器访问 `http://localhost:5173`
2. 点击「选择工作区」按钮，选择你的项目目录
3. 创建或编辑任务
4. 设置并发数（默认1）
5. 点击「全部执行」开始执行任务队列

## 项目结构

```
CodeTasker/
├── backend/
│   ├── src/
│   │   ├── server.js          # 主服务器
│   │   ├── services/          # 业务逻辑
│   │   └── utils/             # 工具函数
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── views/             # 页面组件
│   │   ├── components/        # 业务组件
│   │   ├── stores/            # Pinia状态管理
│   │   └── composables/       # 组合式函数
│   └── package.json
└── README.md
```

## API 接口

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | /api/workspace/open | 选择工作区 |
| GET | /api/tasks | 获取任务列表 |
| POST | /api/tasks | 创建任务 |
| PUT | /api/tasks/:key | 修改任务 |
| DELETE | /api/tasks/:key | 删除任务 |
| PUT | /api/tasks/order | 更新任务顺序 |
| POST | /api/queue/start | 启动队列执行 |
| POST | /api/queue/stop | 停止队列执行 |
| PUT | /api/queue/concurrency | 设置并发数 |

## 数据结构

`code-tasks.json`:
```json
{
  "tasks": [
    {
      "uniqueKey": "uuid",
      "name": "任务名称",
      "prompt": "AI "status": "提示词",
     pending",
      "order": 0,
      "createdAt": "2026-02-02T10:00:00Z"
    }
  ]
}
```

## 注意事项

- 确保系统已安装 `opencode` 命令行工具
- 工作区目录需要包含 `code-tasks.json` 文件（或系统会自动创建）
- 前端开发服务器已配置代理，后端API请求会自动转发
