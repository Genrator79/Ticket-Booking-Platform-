# Ticket Booking Platform - Backend API

Modular monolith backend built with Node.js, Express, and TypeScript.

## Architecture

Follows a layered architectural pattern:
- **Routes**: Define endpoints and attach middleware
- **Controllers**: Translate HTTP requests and responses
- **Services**: Encapsulate business logic and transaction orchestration
- **Repositories**: Encapsulate database interactions (PostgreSQL)
- **Middleware**: Validation, error handling, authentication, rate limiting

## Getting Started

### Development
```bash
npm run dev
```

### Build & Run Production Bundle
```bash
npm run build
npm start
```

### Health Check Endpoint
- `GET /api/health` - Inspect system uptime, memory, and environment.
