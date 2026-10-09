# SOLID Principles Documentation

This document maintains an accurate, evolving record of how SOLID principles are applied across the High-Concurrency Ticket Booking Platform codebase.

---

## SOLID Application Registry

| Principle | File | Class / Symbol | How Applied |
|---|---|---|---|
| **SRP** (Single Responsibility) | [`server/src/controllers/health.controller.ts`](file:///Users/abhijeetkumar/Desktop/SDEPROJECT/server/src/controllers/health.controller.ts) | `getHealthCheck` | Pure HTTP presentation logic: extracts process metrics, formats standardized payload, and returns HTTP response. It does not handle route definitions, app lifecycle, or network binding. |
| **SRP** (Single Responsibility) | [`server/src/config/env.ts`](file:///Users/abhijeetkumar/Desktop/SDEPROJECT/server/src/config/env.ts) | `envSchema` / `env` | Single responsibility for environment variable loading, schema validation, and type-safe export. Decoupled from application runtime logic. |
| **SRP** (Single Responsibility) | [`server/src/middleware/errorHandler.ts`](file:///Users/abhijeetkumar/Desktop/SDEPROJECT/server/src/middleware/errorHandler.ts) | `errorHandler` | Dedicated error logging and centralized JSON response serialization. Keeps routes and controllers clean from repetitive try-catch response blocks. |
| **SRP** (Single Responsibility) | [`client/src/services/api.ts`](file:///Users/abhijeetkumar/Desktop/SDEPROJECT/client/src/services/api.ts) | `api` (Axios instance) | Dedicated HTTP client layer encapsulating base URL, timeout, header defaults, bearer token injection, and global error unwrapping. |
| **SRP** (Single Responsibility) | [`client/src/services/healthService.ts`](file:///Users/abhijeetkumar/Desktop/SDEPROJECT/client/src/services/healthService.ts) | `healthService` | Domain-specific API service isolating health check endpoints from React UI state. |
| **ISP** (Interface Segregation) | [`client/src/types/api.ts`](file:///Users/abhijeetkumar/Desktop/SDEPROJECT/client/src/types/api.ts) | `ApiResponse<T>`, `HealthCheckData` | Lean, specific TypeScript contracts tailored to API transport and health payload without polluting UI domain models. |
| **DIP** (Dependency Inversion) | [`server/src/app.ts`](file:///Users/abhijeetkumar/Desktop/SDEPROJECT/server/src/app.ts) | `createApp` | Factory pattern that creates and configures the Express application independently from the network server listener (`server/src/index.ts`), enabling isolated Supertest integration testing without port binding. |
| **OCP** (Open/Closed) | *Deferred to M09/M12* | *N/A in M01* | Will be applied when introducing `PaymentProvider` abstractions (`MockPaymentProvider` vs real gateways) and job processor handlers. Not artificially forced in M01. |
| **LSP** (Liskov Substitution) | *Deferred to M09* | *N/A in M01* | No inheritance hierarchies exist in M01 setup. Not artificially forced. |

---

## Detailed Analysis

### Single Responsibility Principle (SRP)
- **Problem**: In monolithic and node applications, route handlers often mix request validation, database access, logging, and process metrics, creating tightly coupled, untestable code.
- **Application**:
  - `server/src/routes/health.routes.ts` only registers route paths.
  - `server/src/controllers/health.controller.ts` contains only controller translation logic.
  - `server/src/app.ts` assembles Express middleware and routers.
  - `server/src/index.ts` handles server socket binding and graceful termination.
  - `client/src/services/api.ts` isolates HTTP transport, while `client/src/components/HealthStatus.tsx` focuses purely on user presentation and interaction.

### Dependency Inversion Principle (DIP) & Test Isolation
- **Problem**: Directly calling `app.listen()` inside the Express configuration file prevents automated testing with Supertest without port collisions or lingering socket listeners.
- **Application**: `server/src/app.ts` exports `createApp()`, decoupling the application configuration from the runtime server listener in `server/src/index.ts`. Supertest tests in `server/tests/health.test.ts` instantiate `createApp()` without binding to network ports.
