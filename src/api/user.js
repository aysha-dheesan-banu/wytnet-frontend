import client from './client';

export const getUserById = async (userId) => {
  const response = await client.get(`/users/${userId}`);
  return response.data;
};
