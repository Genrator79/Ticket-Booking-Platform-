import { Request, Response } from 'express';
import { env } from '../config/env.js';
import { checkDbConnection } from '../db/index.js';

export async function getHealthCheck(_req: Request, res: Response) {
  const dbConnected = await checkDbConnection();

  const healthData = {
    status: dbConnected ? 'OK' : 'DEGRADED',
    service: 'ticket-booking-platform-api',
    database: dbConnected ? 'CONNECTED' : 'DISCONNECTED',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
    memoryUsage: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
    },
  };

  res.status(200).json({
    success: true,
    data: healthData,
  });
}
