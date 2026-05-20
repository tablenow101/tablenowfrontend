const TOKEN_KEY = 'backend_token';

// Initialize from localStorage on startup
let accessToken: string | null = localStorage.getItem(TOKEN_KEY);

export function setAccessToken(token: string | null) {
  accessToken = token;

  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getAccessToken() {
  // Return from memory if available
  if (accessToken) return accessToken;

  // Otherwise try localStorage
  accessToken = localStorage.getItem(TOKEN_KEY);
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
  localStorage.removeItem(TOKEN_KEY);
}

