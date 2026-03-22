import client from './client';
import { Follow, BaseResponse } from './types';

export const createFollow = async (targetUserId: string, userId: string): Promise<BaseResponse<Follow>> => {
  const response = await client.post<BaseResponse<Follow>>('/follows', {
    follower_id: userId,
    following_id: targetUserId
  });
  return response.data;
};

export const deleteFollow = async (followId: string): Promise<BaseResponse<void>> => {
  const response = await client.delete<BaseResponse<void>>(`/follows/${followId}`);
  return response.data;
};

export const getUserFollowing = async (userId: string): Promise<BaseResponse<Follow>> => {
  const response = await client.get<BaseResponse<Follow>>(`/users/${userId}/following`);
  return response.data;
};
