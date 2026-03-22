import client from './client';
import { User, BaseResponse } from './types';

export const getUserById = async (userId: string): Promise<BaseResponse<User>> => {
  const response = await client.get<BaseResponse<User>>(`/users/${userId}`);
  return response.data;
};
