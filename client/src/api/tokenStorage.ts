/**
 * In-memory token storage.
 * Access tokens are stored strictly in memory for security against XSS.
 * Refresh tokens are managed exclusively by the browser via HTTP-only SameSite=Strict cookies.
 */

let inMemoryAccessToken: string | null = null;
type TokenListener = (token: string | null) => void;
const listeners: TokenListener[] = [];

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
  listeners.forEach((listener) => listener(token));
}

export function subscribeToTokenChange(listener: TokenListener): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

