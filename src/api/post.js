import client from './client';

export const getPosts = async () => {
  const response = await client.get('/posts/');
  return response.data;
};

export const createPost = async (postData) => {
  const response = await client.post('/posts/', postData);
  return response.data;
};

export const deletePost = async (postId) => {
  const response = await client.delete(`/posts/${postId}`);
  return response.data;
};

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await client.post('/posts/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};
