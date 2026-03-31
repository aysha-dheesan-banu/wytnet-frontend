import client from './client';
import { User, BaseResponse } from './types';
import { getUserIdFromToken } from '../utils/auth';

export const getUserById = async (userId: string): Promise<BaseResponse<User>> => {
  const response = await client.get<BaseResponse<User>>(`/users/${userId}`);
  return response.data;
};

export const getMe = async (): Promise<BaseResponse<User>> => {
  try {
    const response = await client.get<BaseResponse<User>>('/users/me');
    return response.data;
  } catch (error: any) {
    const userId = getUserIdFromToken();
    if (userId) {
      return getUserById(userId);
    }
    throw error;
  }
};

export const updateProfile = async (userData: Partial<User>): Promise<BaseResponse<User>> => {
  const response = await client.put<BaseResponse<User>>('/users/me', userData);
  return response.data;
};

export const getUsers = async (skip: number = 0, limit: number = 100): Promise<BaseResponse<User>> => {
  const response = await client.get<BaseResponse<User>>('/users/', { params: { skip, limit } });
  return response.data;
};

export const createUser = async (userData: Partial<User> & { password?: string }): Promise<BaseResponse<User>> => {
  const response = await client.post<BaseResponse<User>>('/users/', userData);
  return response.data;
};

export const deleteUser = async (userId: string): Promise<BaseResponse<void>> => {
  const response = await client.delete<BaseResponse<void>>(`/users/${userId}`);
  return response.data;
};
