export interface Game {
  id: number;
  title: string;
  description: string;
  developer: string;
  publisher: string;
  release_date: string;
  cover_image_url?: string;
  file_path?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  account_type: 'user' | 'studio';
}

export interface Studio {
  id: number;
  name: string;
  description: string;
  website?: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  role?: string; // default: "user"
}

export interface UserUpdate {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
}

export interface UserResponse {
  user_id: number;
  username: string;
  email: string;
  role: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export interface UserLibraryItem {
  ownership_id: number;
  game_id: number;
  title: string;
  genre?: string;
  platform?: string;
  price?: number;
  hours_played: number;
  status: string;
  date_purchased: string; // ISO date string
}

export interface UserProfile {
  user_id: number;
  username: string;
  email: string;
  role: string;
  total_games: number;
  total_reviews: number;
  created_at: string; // ISO date string
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface LoginResponse {
  user_id: number;
  username: string;
  email: string;
  role: string;
  message: string;
}

// Game interfaces (for your library views)
export interface Game {
  id: number;
  title: string;
  description: string;
  developer: string;
  publisher: string;
  release_date: string;
  cover_image_url?: string;
  file_path?: string;
}

export interface Studio {
  id: number;
  name: string;
  description: string;
  website?: string;
}