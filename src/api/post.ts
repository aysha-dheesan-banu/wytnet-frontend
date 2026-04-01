import client from './client';
import { Post, BaseResponse } from './types';
import { supabase } from '../utils/supabase';

export const getPosts = async (): Promise<BaseResponse<Post>> => {
  const response = await client.get<BaseResponse<Post>>('/posts/');
  return response.data;
};

export const getPostById = async (postId: string): Promise<BaseResponse<Post>> => {
  const response = await client.get<BaseResponse<Post>>(`/posts/${postId}`);
  return response.data;
};

export const createPost = async (postData: Partial<Post>): Promise<BaseResponse<Post>> => {
  const response = await client.post<BaseResponse<Post>>('/posts/', postData);
  return response.data;
};

export const deletePost = async (postId: string): Promise<BaseResponse<void>> => {
  const response = await client.delete<BaseResponse<void>>(`/posts/${postId}`);
  return response.data;
};

export const updatePost = async (postId: string, postData: Partial<Post>): Promise<BaseResponse<Post>> => {
  const response = await client.put<BaseResponse<Post>>(`/posts/${postId}`, postData);
  return response.data;
};

export const uploadImage = async (file: File): Promise<BaseResponse<{ url: string }>> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = fileName; // Upload to root of bucket for simplicity

  const { error: uploadError } = await supabase.storage
    .from('images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('Supabase upload error:', uploadError);
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(filePath);

  console.log('Generated Public URL:', publicUrl);

  return {
    item: { url: publicUrl }
  };
};

export const incrementPostView = async (postId: string): Promise<BaseResponse<Post>> => {
  const response = await client.get<BaseResponse<Post>>(`/posts/${postId}/view`);
  return response.data;
};
