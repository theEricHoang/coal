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