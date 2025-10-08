// Configuration for the application
export const config = {
  // Set to true to use real API, false to use mock data
  useRealAPI: true,  // Changed from false to true

  // API base URL for Phoenix backend
  apiBaseUrl: 'http://localhost:4000/api',

  // Development settings
  dev: {
    enableConsoleLogs: true,
    showApiCalls: true,
  },

  // Feature flags
  features: {
    enableRealTimeUpdates: false,
    enableNotifications: true,
    enableExportFeatures: true,
  }
};

// Helper function to determine if we should use real API
export const shouldUseRealAPI = () => {
  return config.useRealAPI;
};

// Get API service based on configuration
import apiService from '../services/apiService.js';
import { mockApiService } from '../services/mockApiService.js';

export const getApiService = () => {
  return shouldUseRealAPI() ? apiService : mockApiService;
};
