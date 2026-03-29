import client from './client';
import { WishlistItem, BaseResponse } from './types';

export const getWishlist = async (): Promise<BaseResponse<WishlistItem>> => {
  const response = await client.get<BaseResponse<WishlistItem>>('/wishlist/me');
  return response.data;
};

export const createWishlistItem = async (data: Partial<WishlistItem>): Promise<BaseResponse<WishlistItem>> => {
  const response = await client.post<BaseResponse<WishlistItem>>('/wishlist', data);
  return response.data;
};

export const updateWishlistItem = async (id: string, data: Partial<WishlistItem>): Promise<BaseResponse<WishlistItem>> => {
  const response = await client.put<BaseResponse<WishlistItem>>(`/wishlist/${id}`, data);
  return response.data;
};

export const deleteWishlistItem = async (id: string): Promise<BaseResponse<void>> => {
  const response = await client.delete<BaseResponse<void>>(`/wishlist/${id}`);
  return response.data;
};

export const getWishlistMatches = async (id: string): Promise<BaseResponse<any>> => {
  const response = await client.get<BaseResponse<any>>(`/wishlist/${id}/matches`);
  return response.data;
};
