import { useAuthStore } from '../stores/auth-store';
import { API_BASE_URL } from './constants';

interface RequestOptions extends RequestInit {
  retries?: number;
  backoffMs?: number;
}

class ApiClient {
  private getHeaders(): Record<string, string> {
    const { token, user } = useAuthStore.getState();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Include legacy identity headers for backward compatibility
    if (user) {
      headers['x-user-id'] = user.id;
      headers['x-user-role'] = user.role;
      headers['x-user-email'] = user.email || '';
      headers['x-user-name'] = user.name || '';
      headers['x-user-phone'] = user.phone || '';
    }

    return headers;
  }

  private async request<T = any>(
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
    const { retries = 3, backoffMs = 1000, ...fetchOptions } = options;

    const mergedOptions: RequestInit = {
      ...fetchOptions,
      headers: {
        ...this.getHeaders(),
        ...fetchOptions.headers,
      },
    };

    let attempt = 0;
    while (attempt < retries) {
      try {
        const response = await fetch(url, mergedOptions);

        if (response.status === 401 || response.status === 403) {
          // Session expired or unauthorized
          console.warn('API Unauthorized (401/403), logging out...', url);
          useAuthStore.getState().logout();
          throw new Error('Your session has expired. Please log in again.');
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || errData.message || `Request failed with status ${response.status}`);
        }

        return await response.json() as T;
      } catch (error: any) {
        attempt++;
        const isNetworkErr = error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch');
        
        if (isNetworkErr && attempt < retries) {
          const delay = backoffMs * Math.pow(2, attempt - 1);
          console.warn(`API network failure, retrying attempt ${attempt}/${retries} in ${delay}ms...`, url);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }
    throw new Error('Maximum connection retries exceeded');
  }

  public get<T = any>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  public post<T = any>(path: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T = any>(path: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T = any>(path: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T = any>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();
