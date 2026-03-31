import client from './client';
import { setToken } from '../utils/auth';
import { AuthItem, BaseResponse, User } from './types';

export const login = async (email: string, password: string): Promise<BaseResponse<AuthItem>> => {
  const response = await client.post<BaseResponse<AuthItem>>('/auth/login', { email, password });
  const { access_token } = response.data.item!;
  setToken(access_token);
  return response.data;
};

export const register = async (userData: {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  role?: string;
}): Promise<BaseResponse<User>> => {
  // Using email as username to satisfy backend requirement
  const payload = {
    ...userData,
    username: userData.email,
  };
  const response = await client.post<BaseResponse<User>>('/users/', payload);
  return response.data;
};

export const refresh = async (): Promise<BaseResponse<AuthItem>> => {
  const response = await client.post<BaseResponse<AuthItem>>('/auth/refresh');
  const { access_token } = response.data.item!;
  setToken(access_token);
  return response.data;
};
export const googleLogin = async (idToken: string): Promise<BaseResponse<AuthItem>> => {
  const response = await client.post<BaseResponse<AuthItem>>('/auth/google', { id_token: idToken });
  const { access_token } = response.data.item!;
  setToken(access_token);
  return response.data;
};
