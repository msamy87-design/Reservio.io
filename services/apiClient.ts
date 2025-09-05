// Enhanced API client with proper token management and error handling

class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    this.loadTokenFromStorage();
  }

  private loadTokenFromStorage(): void {
    // Try to load from sessionStorage first (for current session)
    this.accessToken = sessionStorage.getItem('reservio_access_token');
    
    // If not found, try localStorage (for "remember me" functionality)
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('reservio_access_token');
    }
  }

  private saveTokenToStorage(token: string, remember: boolean = false): void {
    this.accessToken = token;
    sessionStorage.setItem('reservio_access_token', token);
    
    if (remember) {
      localStorage.setItem('reservio_access_token', token);
    }
  }

  private clearTokenFromStorage(): void {
    this.accessToken = null;
    sessionStorage.removeItem('reservio_access_token');
    localStorage.removeItem('reservio_access_token');
  }

  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    // Handle different response types
    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
        }
      }
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 401) {
        // Token expired or invalid
        this.clearTokenFromStorage();
        
        // Try to refresh token
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          // Retry the original request
          throw new Error('TOKEN_REFRESH_RETRY');
        }
        
        throw new Error('Authentication failed. Please log in again.');
      }

      if (response.status === 403) {
        throw new Error('You do not have permission to perform this action.');
      }

      if (response.status === 429) {
        throw new Error('Too many requests. Please try again later.');
      }

      if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }

      // Use error message from response if available
      const errorMessage = data?.message || data?.error || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  }

  private async tryRefreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Include cookies for refresh token
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userType: 'business' }) // Specify user type
      });

      if (response.ok) {
        const data = await response.json();
        this.saveTokenToStorage(data.accessToken);
        return true;
      }
    } catch (error) {
      console.warn('Token refresh failed:', error);
    }

    return false;
  }

  async request<T>(
    endpoint: string, 
    options: RequestInit = {},
    retryOnAuth: boolean = true
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      credentials: 'include', // Include cookies for refresh tokens
    };

    try {
      const response = await fetch(url, config);
      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error && error.message === 'TOKEN_REFRESH_RETRY' && retryOnAuth) {
        // Retry the request with new token
        const newConfig = {
          ...config,
          headers: {
            ...this.getAuthHeaders(), // Get updated headers with new token
            ...options.headers,
          },
        };
        
        const response = await fetch(url, newConfig);
        return await this.handleResponse<T>(response);
      }
      
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string, remember: boolean = false) {
    const data = await this.request<{ user: any; accessToken: string }>('/auth/business/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    this.saveTokenToStorage(data.accessToken, remember);
    return data;
  }

  async signup(businessName: string, email: string, password: string) {
    const data = await this.request<{ user: any; accessToken: string }>('/auth/business/signup', {
      method: 'POST',
      body: JSON.stringify({ businessName, email, password }),
    });
    
    this.saveTokenToStorage(data.accessToken);
    return data;
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ userType: 'business' }),
      });
    } catch (error) {
      // Continue with logout even if request fails
      console.warn('Logout request failed:', error);
    } finally {
      this.clearTokenFromStorage();
    }
  }

  async getCurrentUser() {
    return this.request<any>('/biz/me');
  }

  // Helper methods for common HTTP verbs
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Get current access token
  getAccessToken(): string | null {
    return this.accessToken;
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
export default apiClient;