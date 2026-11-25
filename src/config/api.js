/**
 * Centralized API Configuration
 * 
 * Resolves the backend API base URL from Vite environment variables (VITE_API_BASE_URL)
 * or defaults to http://localhost:3000 for local development.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
