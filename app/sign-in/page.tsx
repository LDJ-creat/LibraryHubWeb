'use client';

import React, { useState, FormEvent,useEffect } from 'react';
import { get, post } from '@/lib/apiClient';
import { UserProfile, LoginRequestBody } from '@/types/auth';
import { ApiError } from '@/lib/errors';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore'; // 导入Zustand store

export default function SignInPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setUser, setCsrfToken } = useAuthStore(); // 获取Zustand的setUser和setCsrfToken方法

  useEffect(() => {
    const fetchCsrfToken = async () => { // Make the inner function async
      try {
        // Assuming your get function returns a Promise that resolves to { tokenValue: string }
        const result = await get<{ tokenValue: string }>('/auth/csrf-token'); 
        if (result && result.tokenValue) {
          setCsrfToken(result.tokenValue);
          console.log('CSRF token fetched successfully and stored in Zustand.');
        } else {
          console.error('Failed to fetch CSRF token: Invalid response format.');
          // Optionally set an error state here to inform the user
        }
      } catch (err) {
        console.error('Failed to fetch CSRF token:', err);
        // Optionally set an error state here to inform the user
      }
    };

    fetchCsrfToken();
  }, [setCsrfToken]); // Add setCsrfToken to dependency array

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await post<UserProfile, LoginRequestBody>(
        '/auth/login', 
        { username, password }
      );

      // 登录成功
      // 1. 将用户信息存储到Zustand
      const userProfile: UserProfile = {
        id: response.id,
        username: response.username,
        email: response.email,
        avatar: response.avatar,
        role: response.role, 
      };
      setUser(userProfile);
      toast.success('登录成功！');

      // 2. 重定向到首页
      router.push('/'); 

    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message || 'An unexpected error occurred.');
      } else {
        setError('Login failed. Please check your credentials or try again later.');
      }
      console.error('Login error:', err); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-neutral-50 group/design-root overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-gray-200 px-6 md:px-10 py-4 bg-white shadow-sm">
          <div className="flex items-center gap-3 text-gray-900">
            <div className="size-7 text-gray-900">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_6_330)">
                  <path clipRule="evenodd" d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z" fill="currentColor" fillRule="evenodd"></path>
                </g>
                <defs>
                  <clipPath id="clip0_6_330"><rect fill="white" height="48" width="48"></rect></clipPath>
                </defs>
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight">LibraryHub</h1>
          </div>
          <nav className="hidden md:flex items-center gap-6">
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/sign-up" className="flex items-center justify-center rounded-md h-10 px-4 bg-gray-800 text-white text-sm font-semibold hover:bg-gray-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800">
              <span>注册</span>
            </Link>
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-xl shadow-xl">
            <div>
              <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">Welcome back</h2>
            </div>
            <form onSubmit={handleSignIn} className="mt-8 space-y-6" method="POST">
              <input name="remember" type="hidden" defaultValue="true"/>
              <div className="rounded-md space-y-4">
                <div>
                  <label className="sr-only" htmlFor="username">用户名</label>
                  <input
                    className="shadow-sm form-input relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-gray-700 focus:outline-none focus:ring-gray-700 sm:text-sm"
                    id="username"
                    name="username"
                    placeholder="用户名"
                    required
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="sr-only" htmlFor="password">密码</label>
                  <input
                    autoComplete="current-password"
                    className="shadow-sm form-input relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-gray-700 focus:outline-none focus:ring-gray-700 sm:text-sm"
                    id="password"
                    name="password"
                    placeholder="密码"
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link className="font-medium text-gray-800 hover:text-gray-700 underline" href="#forgot-password">
                    忘记密码?
                  </Link>
                </div>
              </div>
              <div>
                <button
                  className="group relative flex w-full justify-center rounded-md border border-transparent bg-gray-800 py-3 px-4 text-sm font-semibold text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 transition-colors disabled:opacity-50"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? '登录中...' : '登录'}
                </button>
              </div>
            </form>
            <p className="mt-8 text-center text-sm text-gray-600">
              还没有账号？
              <Link className="font-medium text-gray-800 hover:text-gray-700 underline" href="/sign-up">
                注册
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
