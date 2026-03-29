import client from './client';
import { Interaction, BaseResponse } from './types';

export const getInteractions = async (): Promise<BaseResponse<Interaction>> => {
  const response = await client.get<BaseResponse<Interaction>>('/interactions/');
  return response.data;
};

export const createInteraction = async (interactionData: Partial<Interaction>): Promise<BaseResponse<Interaction>> => {
  const response = await client.post<BaseResponse<Interaction>>('/interactions/', interactionData);
  return response.data;
};

export const getInteractionsByPost = async (postId: string): Promise<BaseResponse<Interaction>> => {
  const response = await client.get<BaseResponse<Interaction>>(`/interactions/post/${postId}`);
  return response.data;
};
