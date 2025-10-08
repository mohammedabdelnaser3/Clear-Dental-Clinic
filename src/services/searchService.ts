import { apiService } from './api';
import type { ApiResponse } from './api';

export interface SearchResult {
  id: string;
  type: 'patient' | 'appointment' | 'prescription' | 'medication';
  title: string;
  subtitle: string;
  description?: string;
  date?: string;
  status?: string;
  url: string;
}

export const searchService = {
  globalSearch: async (query: string): Promise<ApiResponse<SearchResult[]>> => {
    return apiService.get('/api/v1/search', { q: query });
  },
};
