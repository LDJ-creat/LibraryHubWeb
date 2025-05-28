import { ApiError, AuthenticationError, NotFoundError } from './errors';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

// 定义API响应的基础结构
interface ApiResponse<T> {
  code: number;
  data: T;
  errMessage: string | null;
  isSuccess: boolean;
}

interface RequestOptions extends Omit<RequestInit, 'body' | 'method' | 'headers'> {
  headers?: Record<string, string>;
}

// 辅助函数：从 document.cookie 中获取指定名称的 cookie 值
function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') { 
    return null;
  }
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    // 检查 cookie 是否以指定名称开头(XSRF-TOKEN=)
    if (cookie.startsWith(name + '=')) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204 || response.headers.get('Content-Length') === '0') {// 204 No Content 或者 响应体为空
    return undefined as T; 
  }

  const apiResponse: ApiResponse<T> = await response.json();

  if (!apiResponse.isSuccess || (apiResponse.code !== 200 && apiResponse.code !== 0)) { // code 200 或 0 表示成功
    // 根据HTTP状态码优先判断基础错误类型
    if (response.status === 401) {
      throw new AuthenticationError(apiResponse.errMessage || 'Authentication failed', apiResponse.data);
    }
    if (response.status === 404) {
      throw new NotFoundError(apiResponse.errMessage || 'Resource not found', apiResponse.data);
    }
    // 使用来自API响应的errMessage
    throw new ApiError(apiResponse.errMessage || 'An API error occurred', response.status, apiResponse.data);
  }

  return apiResponse.data;
}

//GET方法不需要设置XSRF-TOKEN，因为它通常不修改服务器状态
export async function get<T>(path: string, options?: RequestOptions): Promise<T> {
  const fetchOptions = options || {};
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    method: 'GET',
    headers: {
      ...fetchOptions?.headers,
    },
    credentials: 'include', // 确保发送 cookies
  });
  return handleResponse<T>(response);
}

export async function post<T, U>(path: string, body: U, options?: RequestOptions): Promise<T> {
  const fetchOptions = options || {};
  const csrfToken = getCookieValue('XSRF-TOKEN'); // Spring Security 默认的 CSRF cookie 名称
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...fetchOptions?.headers,
  };
  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken; // Spring Security 默认的 CSRF header 名称
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    credentials: 'include', // 确保发送 cookies
  });
  return handleResponse<T>(response);
}

export async function put<T, U>(path: string, body: U, options?: RequestOptions): Promise<T> {
  const fetchOptions = options || {};
  const csrfToken = getCookieValue('XSRF-TOKEN');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...fetchOptions?.headers,
  };
  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
    credentials: 'include', // 确保发送 cookies
  });
  return handleResponse<T>(response);
}

export async function del<T>(path: string, options?: RequestOptions): Promise<T> {
  const fetchOptions = options || {};
  const csrfToken = getCookieValue('XSRF-TOKEN');
  const headers: Record<string, string> = {
    ...fetchOptions?.headers,
  };
  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    method: 'DELETE',
    headers,
    credentials: 'include', // 确保发送 cookies
  });
  return handleResponse<T>(response);
}

export async function postFormData<T>(path: string, formData: FormData, options?: RequestOptions): Promise<T> {
  const fetchOptions = options || {};
  const csrfToken = getCookieValue('XSRF-TOKEN');
  // 对于 FormData，浏览器会自动设置 Content-Type，我们不需要显式设置 'Content-Type': 'multipart/form-data'
  const headers: Record<string, string> = { 
    ...fetchOptions?.headers,
  };
  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    method: 'POST',
    headers,
    body: formData,
    credentials: 'include', // 确保发送 cookies
  });
  return handleResponse<T>(response);
}
