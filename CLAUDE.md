# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a monorepo containing multiple learning/sample projects:

- **cdp-performance-monitor**: Chrome DevTools Protocol performance monitoring dashboard
- **opentelemetry-sample**: OpenTelemetry learning app demonstrating Traces, Metrics, and Logs
- **react/keyboard-app**: React keyboard input component with multiple input modes
- **typespec-binary-serializer**: TypeSpec-based binary command serializer/deserializer code generator
- **typespec-sample-app**: Full-stack Todo app using TypeSpec for API definitions

## Project-Specific Commands

### cdp-performance-monitor
```bash
cd cdp-performance-monitor
npm run install:all      # Install all dependencies
npm run dev:backend      # Start Express + WebSocket server (port 3001)
npm run dev:frontend     # Start React dashboard (port 5173)
```
Requires Chrome with `--remote-debugging-port=9222`

### opentelemetry-sample
```bash
cd opentelemetry-sample
npm install
npm run dev              # Start Express server with OpenTelemetry
npm run demo:traces      # Run traces demo
npm run demo:metrics     # Run metrics demo
npm run demo:logs        # Run logs demo
```

### react/keyboard-app
```bash
cd react/keyboard-app
npm install
npm run dev              # Start dev server
npm run build            # TypeScript + Vite build
npm run lint             # Run ESLint
npm run test             # Run tests in watch mode
npm run test:run         # Run tests once
```

### typespec-binary-serializer
```bash
cd typespec-binary-serializer
npm install
npm run build            # Compile TypeScript
npm run generate         # Build and run code generator
```

### typespec-sample-app
```bash
cd typespec-sample-app
npm run install:all      # Install all dependencies (typespec, backend, frontend)
npm run build:typespec   # Generate OpenAPI from TypeSpec
npm run dev:backend      # Start Express backend (port 3001)
npm run dev:frontend     # Start React frontend (port 5173)
```

## Architecture Notes

### cdp-performance-monitor
Chrome DevTools Protocol learning project with real-time dashboard:
- `backend/src/cdp/`: CDP client and domain wrappers (Performance, Profiler, HeapProfiler, Network, Page)
- `backend/src/collectors/`: Unified metrics collection from all CDP domains
- `frontend/`: React + Recharts dashboard with WebSocket real-time updates
- Monitors: CPU profiling, memory/heap analysis, network requests, Core Web Vitals

### typespec-binary-serializer
Pipeline: TypeSpec DSL → Lexer/Parser → IR (Intermediate Representation) → Code Generators (TypeScript/C++/Rust)
- `src/parser/`: Lexer and parser for TypeSpec-like DSL
- `src/ir/`: Intermediate representation types
- `src/generators/`: Multi-language code generators with base class pattern

### typespec-sample-app
TypeSpec-first API development with shared types across frontend and backend:
- `typespec/main.tsp` → generates `tsp-output/openapi.yaml`
- Backend: Express.js with Swagger UI at `/api-docs`
- Frontend: React + Vite with DDD + Layered Architecture

### react/keyboard-app
Virtual keyboard components supporting numeric, hiragana, katakana, and alphabet input modes with realtime/confirm modes. Uses `useKeyboard` hook with function-style updates for rapid consecutive inputs.
