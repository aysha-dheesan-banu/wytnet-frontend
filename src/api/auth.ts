import client from './client';
import { setToken } from '../utils/auth';
import { AuthItem, BaseResponse } from './types';

export const login = async (email: string, password: string): Promise<BaseResponse<AuthItem>> => {
  const response = await client.post<BaseResponse<AuthItem>>('/auth/login', { email, password });
  const { access_token } = response.data.item!;
  setToken(access_token);
  return response.data;
};

export const refresh = async (): Promise<BaseResponse<AuthItem>> => {
  const response = await client.post<BaseResponse<AuthItem>>('/auth/refresh');
  const { access_token } = response.data.item!;
  setToken(access_token);
  return response.data;
};
