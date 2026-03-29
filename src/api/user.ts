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
    // Aggressive fallback: always try token ID if /users/me fails
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
