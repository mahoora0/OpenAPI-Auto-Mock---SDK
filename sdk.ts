export class APIError extends Error {
    readonly status: number;
    readonly statusText: string;
    readonly data: any;
}

export type APIResponse = unknown;

export function isAPIError(error: unknown): error is APIError {

          return error instanceof APIError;
        
}

export interface User {
    id: number;
    name: string;
    email: string;
    bio?: string;
    isActive?: boolean;
    createdAt?: string;
}

export interface Post {
    id: number;
    title: string;
    content: string;
    authorId: number;
    publishedAt?: string;
}

export interface Error {
    error: string;
    message?: string;
}

export class APIClient {
    baseURL: string = "http://localhost:4000";

    async request(method: string, path: string, options?: { body?: any; params?: Record<string, any> }) {

                  const url = new URL(path, this.baseURL);
                  if (options?.params) {
                    Object.entries(options.params).forEach(([key, value]) => {
                      if (value !== undefined) {
                        url.searchParams.append(key, String(value));
                      }
                    });
                  }

                  const config: RequestInit = {
                    method,
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  };

                  if (options?.body) {
                    config.body = JSON.stringify(options.body);
                  }

                  const response = await fetch(url.toString(), config);
                  if (!response.ok) {
                    let errorData;
                    try {
                      errorData = await response.json();
                    } catch {
                      errorData = { message: response.statusText };
                    }
                    throw new APIError(response.status, response.statusText, errorData);
                  }

                  return response.json();
                
    }
}

export let client = new APIClient();

export async function getUsers(options?: { params?: Record<string, any> }): Promise<Record<string, any>[]> {

        const path = `/users`;
        const queryParams: Record<string, any> = {};

        
        if (options?.params?.limit !== undefined) {
          queryParams.limit = options.params.limit;
        }
        
        if (options?.params?.offset !== undefined) {
          queryParams.offset = options.params.offset;
        }

        return client.request('GET', path, {
          body: undefined,
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        });
      
}

export async function postUsers(body: any, options?: { params?: Record<string, any> }): Promise<any> {

        const path = `/users`;
        const queryParams: Record<string, any> = {};

        

        return client.request('POST', path, {
          body: body,
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        });
      
}

export async function getUsers(id: number, options?: { params?: Record<string, any> }): Promise<Record<string, any>> {

        const path = `/users/${id}`;
        const queryParams: Record<string, any> = {};

        

        return client.request('GET', path, {
          body: undefined,
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        });
      
}

export async function getPosts(options?: { params?: Record<string, any> }): Promise<Record<string, any>[]> {

        const path = `/posts`;
        const queryParams: Record<string, any> = {};

        

        return client.request('GET', path, {
          body: undefined,
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        });
      
}
