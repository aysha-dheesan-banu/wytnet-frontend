import client from './client';

export const createFollow = async (targetUserId, userId) => {
  const response = await client.post('/follows', {
    follower_id: userId,
    following_id: targetUserId
  });
  return response.data;
};

export const deleteFollow = async (followId) => {
  const response = await client.delete(`/follows/${followId}`);
  return response.data;
};

export const getUserFollowing = async (userId) => {
  const response = await client.get(`/users/${userId}/following`);
  return response.data;
};
