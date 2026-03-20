import client from './client';
import { setToken } from '../utils/auth';

export const login = async (email, password) => {
  const response = await client.post('/auth/login', { email, password });
  const { access_token } = response.data.item;
  setToken(access_token);
  return response.data;
};

export const refresh = async () => {
  const response = await client.post('/auth/refresh');
  const { access_token } = response.data.item;
  setToken(access_token);
  return response.data;
};
