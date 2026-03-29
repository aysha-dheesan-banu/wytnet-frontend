import client from './client';
import { Interest, BaseResponse } from './types';

export const getInterests = async (): Promise<BaseResponse<Interest>> => {
  const response = await client.get<BaseResponse<Interest>>('/users/me/interests');
  return response.data;
};

export const createInterest = async (data: Partial<Interest>): Promise<BaseResponse<Interest>> => {
  const response = await client.post<BaseResponse<Interest>>('/users/me/interests', data);
  return response.data;
};

export const updateInterest = async (id: string, data: Partial<Interest>): Promise<BaseResponse<Interest>> => {
  const response = await client.put<BaseResponse<Interest>>(`/users/me/interests/${id}`, data);
  return response.data;
};

export const deleteInterest = async (id: string): Promise<BaseResponse<void>> => {
  const response = await client.delete<BaseResponse<void>>(`/users/me/interests/${id}`);
  return response.data;
};
