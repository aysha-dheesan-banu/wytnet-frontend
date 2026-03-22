import client from './client';
import { Favorite, BaseResponse } from './types';

export const createFavorite = async (postId: string, userId: string): Promise<BaseResponse<Favorite>> => {
  const response = await client.post<BaseResponse<Favorite>>('/favorites', { 
    post_id: postId,
    user_id: userId
  });
  return response.data;
};

export const deleteFavorite = async (favoriteId: string): Promise<BaseResponse<void>> => {
  const response = await client.delete<BaseResponse<void>>(`/favorites/${favoriteId}`);
  return response.data;
};

export const getUserFavorites = async (userId: string): Promise<BaseResponse<Favorite>> => {
  const response = await client.get<BaseResponse<Favorite>>(`/users/${userId}/favorites`);
  return response.data;
};
