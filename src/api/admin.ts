import client from './client';
import { BaseResponse, ObjectAlias, ObjectRelation } from './types';

// Object Aliases
export const getAliasesForObject = async (objectId: string): Promise<BaseResponse<ObjectAlias>> => {
  const response = await client.get<BaseResponse<ObjectAlias>>(`/object-aliases/${objectId}`);
  return response.data;
};

export const createAlias = async (data: { object_id: string; alias: string }): Promise<BaseResponse<ObjectAlias>> => {
  const response = await client.post<BaseResponse<ObjectAlias>>('/object-aliases/', data);
  return response.data;
};

export const deleteAlias = async (aliasId: string): Promise<BaseResponse<any>> => {
  const response = await client.delete<BaseResponse<any>>(`/object-aliases/${aliasId}`);
  return response.data;
};

// Object Relations
export const getRelationsForObject = async (objectId: string): Promise<BaseResponse<ObjectRelation>> => {
  const response = await client.get<BaseResponse<ObjectRelation>>(`/object-relations/${objectId}`);
  return response.data;
};

export const createRelation = async (data: { object_id: string; related_object_id: string; relation_type: string }): Promise<BaseResponse<ObjectRelation>> => {
  const response = await client.post<BaseResponse<ObjectRelation>>('/object-relations/', data);
  return response.data;
};

export const deleteRelation = async (relationId: string): Promise<BaseResponse<any>> => {
  const response = await client.delete<BaseResponse<any>>(`/object-relations/${relationId}`);
  return response.data;
};
