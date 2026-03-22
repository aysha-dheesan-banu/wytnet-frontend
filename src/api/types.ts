export interface BaseResponse<T> {
  item?: T;
  items?: T[];
  total?: number;
}

export interface AuthItem {
  access_token: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
}

export interface Post {
  id: string;
  content: string;
  user_id: string;
  image_url?: string;
  created_at: string;
  post_type: 'NEED' | 'OFFER';
  title: string;
  location: string;
  description?: string;
  valid_until?: string;
  user?: User;
}

export interface Favorite {
  id: string;
  post_id: string;
  user_id: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
}

export interface ObjectItem {
  id: string;
  name: string;
  type: string;
}
