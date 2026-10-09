import { Request, Response } from 'express';
import { env } from '../config/env.js';

export function getHealthCheck(_req: Request, res: Response) {
  const healthData = {
    status: 'OK',
    service: 'ticket-booking-platform-api',
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
