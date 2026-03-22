import client from './client';
import { ObjectItem, BaseResponse } from './types';

export const searchObjects = async (query: string): Promise<BaseResponse<ObjectItem>> => {
  if (query.length < 2) return { items: [] };
  const response = await client.get<BaseResponse<ObjectItem>>(`/objects/search?q=${encodeURIComponent(query)}`);
  return response.data;
};

export const getObjects = async (skip = 0, limit = 10): Promise<BaseResponse<ObjectItem>> => {
  const response = await client.get<BaseResponse<ObjectItem>>(`/objects/?skip=${skip}&limit=${limit}`);
  return response.data;
};
