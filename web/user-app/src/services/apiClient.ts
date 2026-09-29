import { SkillPagination } from '../types/skill';

export interface ApiClientOptions extends RequestInit {
  on429?: (retryAfterSeconds: number) => void;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: SkillPagination;
  status: number;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private onRateLimitCallback?: (retryAfterSeconds: number) => void;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  public setToken(token: string | null): void {
    this.token = token;
  }

  public setRateLimitHandler(handler: (retryAfterSeconds: number) => void): void {
    this.onRateLimitCallback = handler;
  }

  public async request<T>(endpoint: string, options: ApiClientOptions = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers || {});

    // Attach Bearer token or API key
    if (this.token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    let response: Response;
    try {
      response = await fetch(url, config);
    } catch (err) {
      throw new Error(`Network connectivity error: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Handle HTTP 429 Rate Limiting per react-vite & castor NFR
    if (response.status === 429) {
      const retryHeader = response.headers.get('Retry-After');
      const retrySeconds = retryHeader ? parseInt(retryHeader, 10) || 5 : 5;
      if (this.onRateLimitCallback) {
        this.onRateLimitCallback(retrySeconds);
      }
      if (options.on429) {
        options.on429(retrySeconds);
      }
      throw new Error(`HTTP 429: Too Many Requests. Backing off for ${retrySeconds}s.`);
    }

    if (!response.ok) {
      let errorDetail = `HTTP ${response.status} ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorDetail = errorJson.detail;
        }
      } catch {
        // Fallback to status text
      }
      throw new Error(errorDetail);
    }

    // Extract pagination headers (FR-1, AC-1)
    let pagination: SkillPagination | undefined;
    const totalCount = response.headers.get('X-Total-Count');
    const page = response.headers.get('X-Page');
    const pageSize = response.headers.get('X-Page-Size');
    const totalPages = response.headers.get('X-Total-Pages');

    if (totalCount !== null && page !== null && pageSize !== null && totalPages !== null) {
      pagination = {
        totalCount: parseInt(totalCount, 10),
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        totalPages: parseInt(totalPages, 10),
      };
    }

    // Parse response
    let data: T;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = (await response.json()) as T;
    } else {
      data = (await response.text()) as unknown as T;
    }

    return {
      data,
      pagination,
      status: response.status,
    };
  }
}

export const apiClient = new ApiClient();
