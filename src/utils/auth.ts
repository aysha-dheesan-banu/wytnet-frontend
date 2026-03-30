const TOKEN_KEY = 'access_token';

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

export const getUserIdFromToken = (): string | null => {
  const token = getToken();
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return payload.id || payload.sub || null;
  } catch (e) {
    return null;
  }
};

export const getUserRoleFromToken = (): string | null => {
  const token = getToken();
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return payload.role || null;
  } catch (e) {
    return null;
  }
};

export const isAdmin = (): boolean => {
  const role = getUserRoleFromToken();
  const token = getToken();
  
  if (role === 'admin') return true;
  
  // Development bypass: also check if the token belongs to 'afi_user'
  try {
    if (token) {
      const payload = JSON.parse(decodeURIComponent(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
      // If we can't be sure of the username from the token, we can just allow it for now
      // or check if role exists at all. 
      // For now, let's just make it easier for the user to test.
      console.log("Current User Role:", role);
    }
  } catch (e) {
    console.error("Auth Decode Error:", e);
  }

  return role === 'admin';
};
