import client from './client';

export const createFavorite = async (postId, userId) => {
  const response = await client.post('/favorites', { 
    post_id: postId,
    user_id: userId
  });
  return response.data;
};

export const deleteFavorite = async (favoriteId) => {
  const response = await client.delete(`/favorites/${favoriteId}`);
  return response.data;
};

export const getUserFavorites = async (userId) => {
  const response = await client.get(`/users/${userId}/favorites`);
  return response.data;
};
