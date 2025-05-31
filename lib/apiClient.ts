import { ApiError, AuthenticationError, NotFoundError } from './errors';
import useAuthStore from '@/store/authStore';

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

// // 辅助函数：从 document.cookie 中获取指定名称的 cookie 值
// function getCookieValue(name: string): string | null {
//   if (typeof document === 'undefined') { 
//     return null;
//   }
//   const cookies = document.cookie.split(';');
//   for (let i = 0; i < cookies.length; i++) {
//     const cookie = cookies[i].trim();
//     // 检查 cookie 是否以指定名称开头(XSRF-TOKEN=)
//     if (cookie.startsWith(name + '=')) {
//       return decodeURIComponent(cookie.substring(name.length + 1));
//     }
//   }
//   return null;
// }

async function handleResponse<T>(response: Response, url: string): Promise<T> { // Added url parameter
  console.log(`[apiClient.handleResponse] Processing response for ${url}. Status: ${response.status}, StatusText: ${response.statusText}`);
  const contentType = response.headers.get('Content-Type');
  const contentLength = response.headers.get('Content-Length');
  console.log(`[apiClient.handleResponse] Headers for ${url}:`, {
    'Content-Type': contentType,
    'Content-Length': contentLength,
  });

  if (response.status === 204 || (contentLength !== null && parseInt(contentLength, 10) === 0)) {
    console.warn(`[apiClient.handleResponse] Response for ${url} is status ${response.status} or Content-Length is 0. Returning undefined.`);
    return undefined as T;
  }

  let apiResponseData;
  try {
    apiResponseData = await response.json();
    console.log(`[apiClient.handleResponse] Parsed JSON response for ${url}.`);
  } catch (error) {
    console.error(`[apiClient.handleResponse] Failed to parse JSON response for ${url}. Status: ${response.status}. Error:`, error);
    try {
        const textBody = await response.text();
        console.error(`[apiClient.handleResponse] Response body (text) for ${url}:`, textBody);
    } catch (textError) {
        console.error(`[apiClient.handleResponse] Failed to read response body as text for ${url}:`, textError);
    }
    throw new ApiError(`Failed to parse JSON response from ${url}. Status: ${response.status}`, response.status, null);
  }

  const apiResponse = apiResponseData as ApiResponse<T>;

  if (!apiResponse.isSuccess || (apiResponse.code !== 200 && apiResponse.code !== 0 && apiResponse.code !== 201)) { // Added 201 for successful creation
    console.error(`[apiClient.handleResponse] API error for ${url}. Code: ${apiResponse.code}, Success: ${apiResponse.isSuccess}, Message: ${apiResponse.errMessage}`);
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

  console.log(`[apiClient.handleResponse] Successfully processed response for ${url}. Returning data.`);
  return apiResponse.data;
}

//GET方法不需要设置XSRF-TOKEN，因为它通常不修改服务器状态
export async function get<T>(path: string, options?: RequestOptions, forwardedCookies?: string): Promise<T> {
  const fetchOptions = options || {};
  const url = `${API_BASE_URL}${path}`;
  console.log('[apiClient.get] Attempting to fetch from:', url);
  const headers: Record<string, string> = {
    ...fetchOptions?.headers,
  };
  if (forwardedCookies) {
    headers['Cookie'] = forwardedCookies;
    console.log('[apiClient.get] Forwarding cookies:', forwardedCookies);
  }
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      method: 'GET',
      headers,
      credentials: 'include',
    });
    console.log(`[apiClient.get] Received response for ${url} with status: ${response.status}`);
    return await handleResponse<T>(response, url); // Pass url to handleResponse
  } catch (error) {
    console.error(`[apiClient.get] Fetch failed for ${url}:`, error);
    // Ensure the error is an instance of Error for consistent handling upstream
    if (error instanceof Error) {
      throw error;
    }
    throw new ApiError(String(error), 0, null); // Wrap non-Error exceptions
  }
}

export async function post<T, U>(path: string, body: U, options?: RequestOptions, forwardedCookies?: string): Promise<T> {
  const fetchOptions = options || {};
  const csrfToken = useAuthStore.getState().csrfToken;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...fetchOptions?.headers,
  };

  console.log('[apiClient.post] CSRF Token from Zustand:', csrfToken);
  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }
  if (forwardedCookies) {
    headers['Cookie'] = forwardedCookies;
    console.log('[apiClient.post] Forwarding cookies:', forwardedCookies);
  }
  const url = `${API_BASE_URL}${path}`;
  console.log('[apiClient.post] Attempting to POST to:', url);
  const response = await fetch(url, {
    ...fetchOptions,
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    credentials: 'include', // 确保发送 cookies
  });
  return await handleResponse<T>(response, url); // 传递 url
}

export async function put<T, U>(path: string, body: U, options?: RequestOptions, forwardedCookies?: string): Promise<T> {
  const fetchOptions = options || {};
  const csrfToken = useAuthStore.getState().csrfToken;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...fetchOptions?.headers,
  };
  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }
  if (forwardedCookies) {
    headers['Cookie'] = forwardedCookies;
    console.log('[apiClient.put] Forwarding cookies:', forwardedCookies);
  }
  const url = `${API_BASE_URL}${path}`;
  console.log('[apiClient.put] Attempting to PUT to:', url);
  const response = await fetch(url, {
    ...fetchOptions,
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
    credentials: 'include', // 确保发送 cookies
  });
  return await handleResponse<T>(response, url); // 传递 url
}

export async function del<T>(path: string, options?: RequestOptions, forwardedCookies?: string): Promise<T> {
  const fetchOptions = options || {};
  const csrfToken = useAuthStore.getState().csrfToken;
  const headers: Record<string, string> = {
    ...fetchOptions?.headers,
  };
  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }
  if (forwardedCookies) {
    headers['Cookie'] = forwardedCookies;
    console.log('[apiClient.del] Forwarding cookies:', forwardedCookies);
  }
  const url = `${API_BASE_URL}${path}`;
  console.log('[apiClient.del] Attempting to DELETE from:', url);
  const response = await fetch(url, {
    ...fetchOptions,
    method: 'DELETE',
    headers,
    credentials: 'include', // 确保发送 cookies
  });
  return await handleResponse<T>(response, url); // 传递 url
}

export async function postFormData<T>(path: string, formData: FormData, options?: RequestOptions, forwardedCookies?: string): Promise<T> {
  const fetchOptions = options || {};
  const headers: Record<string, string> = {
    ...fetchOptions?.headers,
  };

  let url: string;
  let requestCredentials: RequestCredentials = 'include'; // Default for internal API calls

  if (path.startsWith('http://') || path.startsWith('https://')) {
    url = path; //对于外部服务，保持完整的URL
    requestCredentials = 'omit'; // Do not send credentials to external services like pngcdn.cn
    // For FormData to external services, we typically don't set Content-Type; the browser does it with the correct boundary.
    // Also, XSRF tokens are not for external services.
  } else {
    url = `${API_BASE_URL}${path}`; 
    const csrfToken = useAuthStore.getState().csrfToken; 
    if (csrfToken) {
      headers['X-XSRF-TOKEN'] = csrfToken;
    }
    if (forwardedCookies) { // For server-side rendering or specific scenarios with internal API
       headers['Cookie'] = forwardedCookies;
       console.log('[apiClient.postFormData] Forwarding cookies for internal API:', forwardedCookies);
    }
  }

  console.log('[apiClient.postFormData] Attempting to POST FormData to:', url, 'with credentials:', requestCredentials);
  const response = await fetch(url, {
    ...fetchOptions,
    method: 'POST',
    headers, // Browser will set Content-Type for FormData correctly, including boundary
    body: formData,
    credentials: requestCredentials,
  });
  return await handleResponse<T>(response, url); // 传递 url
}
