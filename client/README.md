# SeatForge Client

React 19 + TypeScript + Vite + Tailwind CSS frontend for the High-Concurrency Ticket Booking Platform.

## Features
- **Centralized Axios Client** with interceptors for auth tokens and normalized error reporting (`src/services/api.ts`).
- **Real-Time Health Status Widget** (`src/components/HealthStatus.tsx`) showing latency, server status, memory metrics, and uptime.
- **Modern UI** built with Tailwind CSS v4 and responsive dark-mode aesthetics.

## Scripts
- `npm run dev`: Start Vite development server (port 5173 with proxy to backend port 5001).
- `npm run build`: Compile TypeScript and build production bundle.
- `npm run preview`: Preview production build locally.
