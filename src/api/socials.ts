import client from './client';
import { Social, BaseResponse } from './types';

export const getSocials = async (): Promise<BaseResponse<Social>> => {
  const response = await client.get<BaseResponse<Social>>('/users/me/socials');
  return response.data;
};

export const createSocial = async (data: Partial<Social>): Promise<BaseResponse<Social>> => {
  const response = await client.post<BaseResponse<Social>>('/users/me/socials', data);
  return response.data;
};

export const updateSocial = async (id: string, data: Partial<Social>): Promise<BaseResponse<Social>> => {
  const response = await client.put<BaseResponse<Social>>(`/users/me/socials/${id}`, data);
  return response.data;
};

export const deleteSocial = async (id: string): Promise<BaseResponse<void>> => {
  const response = await client.delete<BaseResponse<void>>(`/users/me/socials/${id}`);
  return response.data;
};
