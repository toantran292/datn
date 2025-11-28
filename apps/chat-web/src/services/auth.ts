export interface MeResponse {
  user_id: string;
  org_id: string;
  email: string;
  roles: string[];
}

class AuthService {
  async getMe(): Promise<MeResponse | null> {
    try {
      console.log('[Auth] Fetching /auth/me...');

      // Use relative path to leverage Vite proxy which will forward cookies properly
      const response = await fetch('/auth/me', {
        method: 'GET',
        credentials: 'include', // Important: send cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('[Auth] Response status:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('[Auth] 401 Unauthorized - user not logged in');
          return null; // Not authenticated
        }
        const errorText = await response.text();
        console.error('[Auth] Error response:', errorText);
        throw new Error(`Failed to get user info: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Auth] getMe() success:', data);
      return data;
    } catch (error) {
      console.error('[Auth] Failed to get me:', error);
      console.error('[Auth] Error stack:', error instanceof Error ? error.stack : 'No stack');
      return null;
    }
  }

  redirectToLogin() {
    // Redirect to auth-web login page
    const authWebUrl = import.meta.env.VITE_AUTH_WEB_URL || 'http://localhost:3000';
    const currentUrl = window.location.href;
    window.location.href = `${authWebUrl}/login?redirect=${encodeURIComponent(currentUrl)}`;
  }
}

export const authService = new AuthService();

