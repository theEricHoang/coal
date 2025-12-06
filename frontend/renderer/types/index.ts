// User Types
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
  profile_picture?: string; // Full URL to profile picture
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export interface UserProfile {
  user_id: number;
  username: string;
  email: string;
  role: string;
  profile_picture?: string;
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
  profile_picture?: string; // Full URL to profile picture
  message: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  profile_picture?: string;
}

// Game Types
export interface GameCreate {
  title: string;
  genre?: string;
  developer?: string;
  release_date?: string; // ISO date string
  platform?: string;
  tags?: string[];
  description?: string;
  price?: number;
  studio_id?: number;
}

export interface GameUpdate {
  title?: string;
  genre?: string;
  developer?: string;
  release_date?: string;
  platform?: string;
  tags?: string[];
  description?: string;
  price?: number;
  studio_id?: number;
}

export interface GameResponse {
  game_id: number;
  title: string;
  genre?: string;
  developer?: string;
  release_date?: string;
  platform?: string;
  tags?: string[];
  description?: string;
  price?: number;
  thumbnail?: string; // Full URL to thumbnail image
  studio_id?: number;
  created_at: string;
  updated_at: string;
}

export interface GameDetail {
  game_id: number;
  title: string;
  genre?: string;
  developer?: string;
  release_date?: string;
  platform?: string;
  tags?: string[];
  description?: string;
  price?: number;
  thumbnail?: string; // Full URL to thumbnail image
  studio_id?: number;
  average_rating?: number;
  total_reviews: number;
  total_owners: number;
  created_at: string;
}

export interface Game {
  game_id: number;
  title: string;
  genre?: string;
  developer?: string;
  release_date?: string;
  platform?: string;
  description?: string;
  price?: number;
  thumbnail?: string;
  studio_id?: number;
}

// Studio Types
export interface StudioCreate {
  name: string;
  logo?: string;
  contact_info?: string;
}

export interface StudioUpdate {
  name?: string;
  logo?: string;
  contact_info?: string;
}

export interface StudioResponse {
  studio_id: number;
  name: string;
  logo?: string; // Full URL to logo image
  contact_info?: string;
  created_at: string;
  updated_at: string;
}

export interface StudioDetail {
  studio_id: number;
  name: string;
  logo?: string;
  contact_info?: string;
  total_games: number;
  created_at: string;
  updated_at: string;
}

export interface Studio {
  studio_id: number;
  name: string;
  logo?: string;
  contact_info?: string;
}

// Library Types
export interface LibraryGameAdd {
  user_id: number;
  game_id: number;
  type: string; // "digital", "physical", "subscription"
  options?: Record<string, any>;
  game_studio_id?: number;
}

export interface LibraryGameUpdate {
  status?: string; // "owned", "playing", "completed", "wishlist"
  hours_played?: number;
  loaned_to?: number;
  loan_duration?: number;
}

export interface UserLibraryItem {
  ownership_id: number;
  game_id: number;
  title: string;
  genre?: string;
  platform?: string;
  price?: number;
  thumbnail?: string;
  hours_played: number;
  status: string;
  date_purchased: string; // ISO date string
  loaned_to?: number;
  loaned_to_username?: string;
  loan_duration?: number;
  is_borrowed?: boolean;
  owner_id?: number;
  owner_username?: string;
  days_remaining?: number;
  tags?: string[];
}

// Review Types
export interface ReviewCreate {
  game_id: number;
  user_id: number;
  rating: number; // 1-5
  review_text?: string;
  game_studio_id?: number;
}

export interface ReviewUpdate {
  rating?: number;
  review_text?: string;
}

export interface ReviewResponse {
  review_id: number;
  game_id: number;
  user_id: number;
  username: string;
  game_title: string;
  rating: number;
  review_text?: string;
  created_at: string;
  updated_at: string;
}