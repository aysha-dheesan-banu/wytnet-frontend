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
  name?: string;
  nickname?: string;
  phone?: string;
  location?: string;
  bio?: string;
  gender?: string;
  dob?: string;
  marital_status?: string;
  mother_tongue?: string;
  languages?: string;
  avatar_url?: string;
  profile_picture_url?: string;
}

export interface Post {
  id: string;
  content: string;
  user_id: string;
  object_id: string;
  image_url?: string;
  created_at: string;
  post_type: 'NEED' | 'OFFER';
  title: string;
  location: string;
  description?: string;
  valid_until?: string;
  user?: User;
  like_count?: number;
  comment_count?: number;
  view_count?: number;
  allow_like?: boolean;
  allow_comment?: boolean;
  allow_share?: boolean;
  allow_response?: boolean;
}

export interface WishlistStep {
  title: string;
  is_completed: boolean;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  post_id?: string;
  title: string;
  description?: string;
  status: 'ONGOING' | 'COMPLETED';
  is_public: boolean;
  category?: string;
  target_date?: string;
  steps: WishlistStep[];
  created_at: string;
  updated_at?: string;
  // UI helper fields
  progress?: number;
  steps_count?: number;
  completed_steps?: number;
  visibility?: 'PUBLIC' | 'PRIVATE'; 
}

export interface Education {
  id: string;
  user_id: string;
  university: string;
  degree: string;
  start_year: string;
  end_year?: string;
  grade?: string;
  location?: string;
  description?: string;
}

export interface Work {
  id: string;
  user_id: string;
  role: string;
  company: string;
  type: string;
  duration?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  domain?: string;
  description?: string;
}

export interface Social {
  id: string;
  user_id: string;
  platform: string;
  username: string;
  link: string;
  visibility: 'PUBLIC' | 'PRIVATE';
}

export interface Interest {
  id: string;
  user_id: string;
  title: string;
  category: string;
  experience_years?: number;
  level: string;
  description?: string;
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

export interface ObjectAlias {
  id: string;
  object_id: string;
  alias: string;
}

export interface ObjectType {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
}

export interface WytObject {
  id: string;
  name: string;
  category?: string;
  description?: string;
  icon?: string;
  type_id?: string;
  is_active: boolean;
  normalized_name: string;
  aliases?: ObjectAlias[];
  type?: ObjectType;
  child_count?: number;
  parent_name?: string;
}

export interface ObjectRelation {
  id: string;
  object_id: string;
  related_object_id: string;
  relation_type: string;
  related_object?: WytObject;
}

// Deprecated in favor of WytObject, but keeping for compatibility if needed
export interface ObjectItem {
  id: string;
  name: string;
  type?: string;
}

export interface Interaction {
  id: string;
  post_id: string;
  user_id: string;
  action_type: 'RESPONSE' | 'CHAT' | 'MATCH' | 'COMMENT';
  content: string;
  created_at: string;
  user?: User;
}

export type NotificationType = 'POST_EXPIRED' | 'NEW_MATCH' | 'NEW_CHAT';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  is_read: boolean;
  post_id?: string;
  user_id?: string; // For chat notifications
  data?: any; // Extra payload data
}
