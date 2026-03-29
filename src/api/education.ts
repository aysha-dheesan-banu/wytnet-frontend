import client from './client';
import { Education, BaseResponse } from './types';

export const getEducation = async (): Promise<BaseResponse<Education>> => {
  const response = await client.get<BaseResponse<Education>>('/users/me/education');
  return response.data;
};

export const createEducation = async (data: Partial<Education>): Promise<BaseResponse<Education>> => {
  const response = await client.post<BaseResponse<Education>>('/users/me/education', data);
  return response.data;
};

export const updateEducation = async (id: string, data: Partial<Education>): Promise<BaseResponse<Education>> => {
  const response = await client.put<BaseResponse<Education>>(`/users/me/education/${id}`, data);
  return response.data;
};

export const deleteEducation = async (id: string): Promise<BaseResponse<void>> => {
  const response = await client.delete<BaseResponse<void>>(`/users/me/education/${id}`);
  return response.data;
};
