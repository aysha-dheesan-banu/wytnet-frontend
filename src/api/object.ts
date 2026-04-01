import client from './client';
import { WytObject, BaseResponse, ObjectType, ObjectAlias } from './types';
import { supabase } from '../utils/supabase';

// Public/Common operations
export const searchObjects = async (query: string): Promise<BaseResponse<WytObject>> => {
  if (query.length < 1) return { items: [] };
  const response = await client.get<BaseResponse<WytObject>>(`/objects/search?q=${encodeURIComponent(query)}`);
  return response.data;
};

export const getObjects = async (skip = 0, limit = 100): Promise<BaseResponse<WytObject>> => {
  const response = await client.get<BaseResponse<WytObject>>(`/objects/?skip=${skip}&limit=${limit}`);
  return response.data;
};

export const getObjectById = async (id: string): Promise<BaseResponse<WytObject>> => {
  const response = await client.get<BaseResponse<WytObject>>(`/objects/${id}`);
  return response.data;
};

// Admin-only operations
export const createObject = async (data: Partial<WytObject>): Promise<BaseResponse<WytObject>> => {
  const response = await client.post<BaseResponse<WytObject>>('/objects/', data);
  return response.data;
};

export const uploadObjectIcon = async (file: File): Promise<BaseResponse<string>> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `objects/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return {
      item: publicUrl
    } as any;
  } catch (error: any) {
    console.error('Error uploading object icon:', error);
    return {
      error: error.message || 'Failed to upload icon'
    } as any;
  }
};

export const updateObject = async (id: string, data: Partial<WytObject>): Promise<BaseResponse<WytObject>> => {
  const response = await client.put<BaseResponse<WytObject>>(`/objects/${id}`, data);
  return response.data;
};

export const deleteObject = async (id: string): Promise<BaseResponse<any>> => {
  const response = await client.delete<BaseResponse<any>>(`/objects/${id}`);
  return response.data;
};

// Object Types
export const getObjectTypes = async (): Promise<BaseResponse<ObjectType>> => {
  const response = await client.get<BaseResponse<ObjectType>>('/object-types/');
  return response.data;
};

export const createObjectType = async (data: Partial<ObjectType>): Promise<BaseResponse<ObjectType>> => {
  const response = await client.post<BaseResponse<ObjectType>>('/object-types/', data);
  return response.data;
};

export const updateObjectType = async (id: string, data: Partial<ObjectType>): Promise<BaseResponse<ObjectType>> => {
  const response = await client.put<BaseResponse<ObjectType>>(`/object-types/${id}`, data);
  return response.data;
};

export const deleteObjectType = async (id: string): Promise<BaseResponse<any>> => {
  const response = await client.delete<BaseResponse<any>>(`/object-types/${id}`);
  return response.data;
};

// Object Relations
export const getObjectRelations = async (objectId: string): Promise<BaseResponse<any>> => {
  const response = await client.get<BaseResponse<any>>(`/object-relations/${objectId}`);
  return response.data;
};

// Object Aliases
export const getObjectAliases = async (objectId: string): Promise<BaseResponse<ObjectAlias>> => {
  const response = await client.get<BaseResponse<ObjectAlias>>(`/object-aliases/${objectId}`);
  return response.data;
};
