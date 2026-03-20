import client from './client';

export const searchObjects = async (query) => {
  if (query.length < 2) return { items: [] };
  const response = await client.get(`/objects/search?q=${encodeURIComponent(query)}`);
  return response.data;
};
