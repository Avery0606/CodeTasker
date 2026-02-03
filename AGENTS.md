# AGENTS.md

本文档为在此代码库中工作的 AI Agent 提供指导规范。

## 构建命令

### 前端 (Vue 3 + Vite)
```bash
cd frontend
npm install          # 安装依赖
npm run dev          # 启动开发服务器 (http://localhost:5173)
npm run build        # 构建生产版本
npm run preview      # 预览生产版本
```

### 后端 (Express.js)
```bash
cd backend
npm install          # 安装依赖
npm start            # 启动生产服务器 (http://localhost:3000)
npm run dev          # 启动自动重载模式 (--watch)
```

### 全栈启动
先启动后端，再启动前端：
```bash
cd backend && npm start
cd frontend && npm run dev
```

## 测试命令

当前未配置测试框架。如需添加测试：
- 前端：安装 Vitest (`npm install -D vitest`) 或 Jest
- 后端：安装 Jest (`npm install -D jest`)

单测试运行：
```bash
# Vitest
npm run test -- --run

# Jest
npm test -- --testPathPattern=filename
```

## 代码检查命令

当前未配置 linting。推荐配置：
```bash
# 前端 (ESLint)
npx eslint src --ext .vue,.js,.ts --fix

# 后端 (ESLint)
npx eslint src --ext .js --fix
```

## 代码风格规范

### 导入
- 使用 ES 模块语法 (`import`/`export`)
- 分组导入：内置模块 → 第三方模块 → 本地模块
- 包名使用绝对路径导入，本地文件使用相对路径
```javascript
import express from 'express'
import { WebSocketServer } from 'ws'
import { useTaskStore } from '@/stores/taskStore'
```

### 格式
- 使用 2 空格缩进
- 行尾不加分号
- 字符串使用单引号
- 函数定义之间空一行
- 最大行长度：100 字符

### 类型
- 本项目不使用 TypeScript；如需类型提示使用 JSDoc
```javascript
/**
 * @param {string} path
 * @returns {Promise<boolean>}
 */
async function openWorkspace(path) { }
```

### 命名规范
- **变量/函数**：camelCase (`taskList`, `loadTasks`)
- **常量**：SCREAMING_SNAKE_CASE (`TASKS_FILE`, `PORT`)
- **类**：PascalCase (`QueueManager`, `Executor`)
- **Vue 组件**：PascalCase 文件名 (`TaskQueue.vue`)
- **组合式函数**：camelCase 以 `use` 前缀开头 (`useWebSocket`)

### Vue 组合式 API
- 组件使用 `<script setup>` 语法
- 使用 `defineStore` 组合式函数模式
- 使用 composables 共享逻辑
```javascript
export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref([])
  // ... 函数
  return { tasks, /* ... */ }
})
```

### 错误处理
- 异步操作使用 try/catch 包裹
- 使用 `console.error()` 记录错误
- 失败时返回 `null` 或 `false`，由调用方处理 UI 反馈
- API 响应使用正确的 HTTP 状态码 (400, 404, 500)
```javascript
try {
  const res = await fetch('/api/tasks')
  return await res.json()
} catch (e) {
  console.error('加载任务失败:', e)
  return []
}
```

### 文件组织
- `backend/src/`：server.js, services/, utils/
- `frontend/src/`：views/, components/, stores/, composables/
- 文件不超过 300 行；大型文件需拆分

### API 设计
- RESTful 端点使用正确的 HTTP 方法
- 使用 WebSocket 实现实时更新（任务输出、状态变更）
- 统一响应格式：`{ success: boolean, data?: any, error?: string }`
- 通过 `broadcast()` 向所有连接的客户端广播更新

### 项目规范
- 使用 `code-tasks.json` 持久化任务数据
- 任务状态值：`pending`, `running`, `completed`, `failed`
- 使用 `uuid` 作为任务唯一标识
- 日期时间使用 ISO 8601 格式
- 允许中文注释（面向中文团队）

## 开发流程

1. 后端修改：重启 Express 服务器
2. 前端修改：Vite HMR 自动更新
3. 手动测试：浏览器访问 http://localhost:5173
4. 当前未配置 CI/CD 流水线
