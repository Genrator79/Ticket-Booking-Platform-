import api from './api';
import type { ApiResponse, HealthCheckData } from '../types/api';

export const healthService = {
  async checkHealth(): Promise<HealthCheckData> {
    const response = await api.get<ApiResponse<HealthCheckData>>('/health');
    if (!response.data.data) {
      throw new Error('Health check response missing payload');
    }
    return response.data.data;
  },
};
