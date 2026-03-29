import client from './client';
import { Work, BaseResponse } from './types';

export const getWorks = async (): Promise<BaseResponse<Work>> => {
  const response = await client.get<BaseResponse<Work>>('/users/me/work');
  return response.data;
};

export const createWork = async (data: Partial<Work>): Promise<BaseResponse<Work>> => {
  const response = await client.post<BaseResponse<Work>>('/users/me/work', data);
  return response.data;
};

export const updateWork = async (id: string, data: Partial<Work>): Promise<BaseResponse<Work>> => {
  const response = await client.put<BaseResponse<Work>>(`/users/me/work/${id}`, data);
  return response.data;
};

export const deleteWork = async (id: string): Promise<BaseResponse<void>> => {
  const response = await client.delete<BaseResponse<void>>(`/users/me/work/${id}`);
  return response.data;
};
