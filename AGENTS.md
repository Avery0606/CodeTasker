# AGENTS.md

This file provides guidelines for AI agents working in this codebase.

## Build Commands

### Frontend (Vue 3 + Vite)
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start development server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend (Express.js)
```bash
cd backend
npm install          # Install dependencies
npm start            # Start production server (http://localhost:3000)
npm run dev          # Start with auto-reload (--watch mode)
```

### Full Stack
Start backend first, then frontend:
```bash
cd backend && npm start
cd frontend && npm run dev
```

## Testing Commands

There are currently no test frameworks configured. To add tests:
- Frontend: Install Vitest (`npm install -D vitest`) or Jest
- Backend: Install Jest (`npm install -D jest`)

For single test runs:
```bash
# With Vitest
npm run test -- --run

# With Jest
npm test -- --testPathPattern=filename
```

## Linting Commands

No linting configured. Recommended setup:
```bash
# Frontend (ESLint)
npx eslint src --ext .vue,.js,.ts --fix

# Backend (ESLint)
npx eslint src --ext .js --fix
```

## Code Style Guidelines

### Imports
- Use ES module syntax (`import`/`export`)
- Group imports: built-in → third-party → local
- Use absolute imports from package names, relative paths for local files
```javascript
import express from 'express'
import { WebSocketServer } from 'ws'
import { useTaskStore } from '@/stores/taskStore'
```

### Formatting
- Use 2-space indentation
- No semicolons at line ends
- Use single quotes for strings
- One blank line between function definitions
- Max line length: 100 characters

### Types
- No TypeScript in this project; use JSDoc for type hints if needed
```javascript
/**
 * @param {string} path
 * @returns {Promise<boolean>}
 */
async function openWorkspace(path) { }
```

### Naming Conventions
- **Variables/functions**: camelCase (`taskList`, `loadTasks`)
- **Constants**: SCREAMING_SASE (`TASKS_FILE`, `PORT`)
- **Classes**: PascalCase (`QueueManager`, `Executor`)
- **Vue components**: PascalCase files (`TaskQueue.vue`)
- **Composable functions**: camelCase with `use` prefix (`useWebSocket`)

### Vue Composition API
- Use `<script setup>` syntax for components
- Use `defineStore` with composition function pattern
- Use composables for shared logic
```javascript
export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref([])
  // ... functions
  return { tasks, /* ... */ }
})
```

### Error Handling
- Wrap async operations in try/catch blocks
- Log errors with `console.error()`
- Return `null` or `false` on failure, let caller handle UI feedback
- Use proper HTTP status codes in API responses (400, 404, 500)
```javascript
try {
  const res = await fetch('/api/tasks')
  return await res.json()
} catch (e) {
  console.error('Load tasks failed:', e)
  return []
}
```

### File Organization
- `backend/src/`: server.js, services/, utils/
- `frontend/src/`: views/, components/, stores/, composables/
- Keep files under 300 lines; split larger files

### API Design
- RESTful endpoints with proper HTTP methods
- WebSocket for real-time updates (task output, status changes)
- Consistent response format: `{ success: boolean, data?: any, error?: string }`
- Broadcast updates to all connected clients via `broadcast()`

### Project Conventions
- Use `code-tasks.json` for task persistence
- Task status values: `pending`, `running`, `completed`, `failed`
- Use `uuid` for task unique identifiers
- DateTime in ISO 8601 format
- Chinese comments acceptable for Chinese-speaking team

## Development Workflow

1. Backend changes: restart the Express server
2. Frontend changes: Vite HMR updates automatically
3. Test changes manually via browser at http://localhost:5173
4. No CI/CD pipeline currently configured
