import axios, { AxiosError } from 'axios';
import {
  UserCreate,
  UserLogin,
  LoginResponse,
  UserResponse,
  UserProfile,
  UserLibraryItem,
  UserUpdate,
} from '../types';

const API_BASE_URL = 'http://localhost:8000'; // Adjust to your FastAPI backend URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests (if needed for protected routes)
api.interceptors.request.use((config) => {
  const userId = localStorage.getItem('userId');
  if (userId) {
    // If your backend needs userId in headers, uncomment:
    // config.headers['X-User-Id'] = userId;
  }
  return config;
});

// Handle API errors
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail: string }>;
    if (axiosError.response?.data?.detail) {
      return axiosError.response.data.detail;
    }
    return axiosError.message || 'An error occurred';
  }
  return 'An unexpected error occurred';
};

// ============================================
// Auth API
// ============================================

export const authAPI = {
  /**
   * Register a new user
   * POST /users/register
   */
  register: async (userData: UserCreate): Promise<UserResponse> => {
    const response = await api.post<UserResponse>('/users/register', userData);
    return response.data;
  },

  /**
   * Login user
   * POST /users/login
   */
  login: async (credentials: UserLogin): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/users/login', credentials);
    
    // Store user info in localStorage
    if (response.data.user_id) {
      localStorage.setItem('userId', response.data.user_id.toString());
      localStorage.setItem('username', response.data.username);
      localStorage.setItem('userRole', response.data.role);
      localStorage.setItem('userEmail', response.data.email);
    }
    
    return response.data;
  },

  /**
   * Logout user (client-side only)
   */
  logout: () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('userId');
  },

  /**
   * Get current user ID
   */
  getCurrentUserId: (): number | null => {
    const userId = localStorage.getItem('userId');
    return userId ? parseInt(userId) : null;
  },
};

// ============================================
// User API
// ============================================

export const userAPI = {
  /**
   * Get user by ID
   * GET /users/{user_id}
   */
  getUser: async (userId: number): Promise<UserResponse> => {
    const response = await api.get<UserResponse>(`/users/${userId}`);
    return response.data;
  },

  /**
   * Get user profile
   * GET /users/{user_id}/profile
   */
  getProfile: async (userId: number): Promise<UserProfile> => {
    const response = await api.get<UserProfile>(`/users/${userId}/profile`);
    return response.data;
  },

  /**
   * Get user's game library
   * GET /users/{user_id}/library
   */
  getLibrary: async (userId: number): Promise<UserLibraryItem[]> => {
    const response = await api.get<UserLibraryItem[]>(`/users/${userId}/library`);
    return response.data;
  },

  /**
   * Update user
   * PATCH /users/{user_id}
   */
  updateUser: async (userId: number, updates: UserUpdate): Promise<UserResponse> => {
    const response = await api.patch<UserResponse>(`/users/${userId}`, updates);
    return response.data;
  },

  /**
   * Delete user
   * DELETE /users/{user_id}
   */
  deleteUser: async (userId: number): Promise<void> => {
    await api.delete(`/users/${userId}`);
  },
};

// ============================================
// Studio API
// ============================================

export const studioAPI = {
  /**
   * Create a new studio
   * POST /studios/
   */
  createStudio: async (studioData: { name: string; contact_info?: string; user_id?: number }) => {
    const response = await api.post('/studios/', studioData);
    return response.data;
  },

  /**
   * Upload studio logo
   * POST /studios/{studio_id}/upload-logo
   */
  uploadLogo: async (studioId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/studios/${studioId}/upload-logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Upload user profile picture
   * POST /users/{user_id}/upload-profile-picture
   */
  uploadProfilePicture: async (userId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/users/${userId}/upload-profile-picture`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// ============================================
// Games API (placeholder for your game upload endpoints)
// ============================================

export const gamesAPI = {
  uploadGame: async (gameData: FormData) => {
    const response = await api.post('/games/upload', gameData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  getGameDetails: async (gameId: number) => {
    const response = await api.get(`/games/${gameId}`);
    return response.data;
  },

  getAllGames: async (limit: number = 50, offset: number = 0) => {
    const response = await api.get('/games/', {
      params: { limit, offset },
    });
    return response.data;
  },

  searchGames: async (query: string, page: number = 1, pageSize: number = 50) => {
    const response = await api.get('/games/search', {
      params: { q: query, page, page_size: pageSize },
    });
    return response.data;
  },
};

export default api;