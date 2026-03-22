import client from './client';
import { Post, BaseResponse } from './types';

export const getPosts = async (): Promise<BaseResponse<Post>> => {
  const response = await client.get<BaseResponse<Post>>('/posts/');
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

export const uploadImage = async (file: File): Promise<BaseResponse<{ url: string }>> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await client.post<BaseResponse<{ url: string }>>('/posts/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};
