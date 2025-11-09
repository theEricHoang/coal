import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api'; // Adjust to your FastAPI backend URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Game {
  id: number;
  title: string;
  description: string;
  developer: string;
  publisher: string;
  release_date: string;
  cover_image_url?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export const authAPI = {
  signIn: async (email: string, password: string) => {
    const response = await api.post('/auth/signin', { email, password });
    return response.data;
  },
  signUp: async (username: string, email: string, password: string) => {
    const response = await api.post('/auth/signup', { username, email, password });
    return response.data;
  },
};

export const gamesAPI = {
  getUserLibrary: async () => {
    const response = await api.get<Game[]>('/games/library');
    return response.data;
  },
  uploadGame: async (gameData: FormData) => {
    const response = await api.post('/games/upload', gameData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  getGameDetails: async (gameId: number) => {
    const response = await api.get<Game>(`/games/${gameId}`);
    return response.data;
  },
};

export default api;