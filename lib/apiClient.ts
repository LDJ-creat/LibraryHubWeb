import { ApiError, AuthenticationError, NotFoundError } from './errors';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api'; // 默认API基础路径，如果环境变量未设置

interface RequestOptions extends RequestInit {
  token?: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e: unknown) {
      // 如果响应体不是JSON，或者解析失败,则捕获错误
      errorData = { message: response.statusText + (typeof e === 'object' && e !== null && 'toString' in e ? (e as { toString: () => string }).toString() : String(e)) };
    }

    if (response.status === 401) {
      throw new AuthenticationError(errorData?.message || 'Authentication failed', errorData);
    }
    if (response.status === 404) {
      throw new NotFoundError(errorData?.message || 'Resource not found', errorData);
    }
    throw new ApiError(errorData?.message || 'An API error occurred', response.status, errorData);
  }

  // 如果响应成功，但内容为空 (例如 204 No Content)
  if (response.status === 204 || response.headers.get('Content-Length') === '0') {
    return null as T; 
  }

  return response.json() as Promise<T>;
}

function getAuthHeaders(token?: string): Record<string, string> {
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  // 如果有全局的token管理机制，可以在这里获取
  // const globalToken = getGlobalAuthToken();
  // if (globalToken) return { 'Authorization': `Bearer ${globalToken}` };
  return {};
}

export async function get<T>(path: string, options?: RequestOptions): Promise<T> {
  const { token, ...fetchOptions } = options || {};
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(token),
      ...fetchOptions?.headers,
    },
  });
  return handleResponse<T>(response);
}

export async function post<T, U>(path: string, body: U, options?: RequestOptions): Promise<T> {
  const { token, ...fetchOptions } = options || {};
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(token),
      ...fetchOptions?.headers,
    },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function put<T, U>(path: string, body: U, options?: RequestOptions): Promise<T> {
  const { token, ...fetchOptions } = options || {};
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(token),
      ...fetchOptions?.headers,
    },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function del<T>(path: string, options?: RequestOptions): Promise<T> {
  const { token, ...fetchOptions } = options || {};
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(token),
      ...fetchOptions?.headers,
    },
  });
  return handleResponse<T>(response);
}

//创建一个不同的函数处理 FormData实现文件上传
export async function postFormData<T>(path: string, formData: FormData, options?: RequestOptions): Promise<T> {
  const { token, ...fetchOptions } = options || {};
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    method: 'POST',
    headers: {
      // 对于 FormData，浏览器会自动设置 Content-Type 为 multipart/form-data，通常不需要手动设置
      ...getAuthHeaders(token),
      ...fetchOptions?.headers, 
    },
    body: formData,
  });
  return handleResponse<T>(response);
}
