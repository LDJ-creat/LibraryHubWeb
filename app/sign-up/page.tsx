'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { post } from '@/lib/apiClient';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/errors';
import useAuthStore from '@/store/authStore'; // 导入Zustand store
import {UserProfile, SignUpRequestBody as SignUpRequestBodyType } from '@/types/auth'; // 从 types/auth.ts 导入类型, SignUpRequestBody 已在该文件顶部定义，避免重复导入
import {toast} from 'react-toastify'; // 假设你有一个 Toast 组件用于显示错误信息

export default function SignUpPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerificationCodeLoading, setIsVerificationCodeLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useAuthStore(); // 获取Zustand的setUser方法

  const handleSendVerificationCode = async () => {
    if (!email) {
      setError('请输入邮箱地址');
      return;
    }
    setIsVerificationCodeLoading(true);
    setError(null);
    try {
      await post('/auth/send-verification-code', { email });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message || '发送验证码失败，请稍后重试。');
      } else {
        setError('发送验证码失败，请稍后重试。');
      }
      console.error('Send verification code error:', err);
    } finally {
      setIsVerificationCodeLoading(false);
    }
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const response = await post<UserProfile, SignUpRequestBodyType>(
        '/auth/register',
        { username, email, emailVerificationCode, password }
      );

      // 注册成功
      // 1. 将用户信息存储到Zustand
      const userProfile: UserProfile = {
        id: response.id,
        username: response.username,
        email: response.email,
        avatar: response.avatar,
        role: response.role,
      };
      setUser(userProfile);
      toast.success('欢迎来到LibraryHub！');
      // 2. 重定向到首页
      router.push('/');

    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message || '注册失败，请检查您填写的信息。');
      } else {
        setError('注册失败，请检查您填写的信息或稍后重试。');
      }
      console.error('Sign up error:', err);
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
                <g clipPath="url(#clip0_6_330_signup)"> {/* Ensure unique clipPath ID if needed */}
                  <path clipRule="evenodd" d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z" fill="currentColor" fillRule="evenodd"></path>
                </g>
                <defs>
                  <clipPath id="clip0_6_330_signup"><rect fill="white" height="48" width="48"></rect></clipPath>
                </defs>
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight">LibraryHub</h1>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {/* Navigation links can be added here if needed */}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="flex items-center justify-center rounded-md h-10 px-4 bg-gray-800 text-white text-sm font-semibold hover:bg-gray-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800">
              <span>登录</span>
            </Link>
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-xl shadow-xl">
            <div>
              <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">创建您的账户</h2>
            </div>
            <form onSubmit={handleSignUp} className="mt-8 space-y-6">
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
                  <label className="sr-only" htmlFor="email">邮箱地址</label>
                  <input
                    className="shadow-sm form-input relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-gray-700 focus:outline-none focus:ring-gray-700 sm:text-sm"
                    id="email"
                    name="email"
                    placeholder="邮箱地址"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading || isVerificationCodeLoading}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="sr-only" htmlFor="emailVerificationCode">邮箱验证码</label>
                  <input
                    className="shadow-sm form-input relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-gray-700 focus:outline-none focus:ring-gray-700 sm:text-sm"
                    id="emailVerificationCode"
                    name="emailVerificationCode"
                    placeholder="邮箱验证码"
                    required
                    type="text"
                    value={emailVerificationCode}
                    onChange={(e) => setEmailVerificationCode(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={handleSendVerificationCode}
                    disabled={isLoading || isVerificationCodeLoading || !email}
                    className="whitespace-nowrap rounded-md border border-transparent bg-gray-600 py-3 px-4 text-sm font-semibold text-white hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                  >
                    {isVerificationCodeLoading ? '发送中...' : '获取验证码'}
                  </button>
                </div>
                <div>
                  <label className="sr-only" htmlFor="password">密码</label>
                  <input
                    autoComplete="new-password"
                    className="shadow-sm form-input relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-gray-700 focus:outline-none focus:ring-gray-700 sm:text-sm"
                    id="password"
                    name="password"
                    placeholder="密码 (至少8位，包含字母和数字)"
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="sr-only" htmlFor="confirmPassword">确认密码</label>
                  <input
                    autoComplete="new-password"
                    className="shadow-sm form-input relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-gray-700 focus:outline-none focus:ring-gray-700 sm:text-sm"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="确认密码"
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4 mt-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <button
                  className="group relative flex w-full justify-center rounded-md border border-transparent bg-gray-800 py-3 px-4 text-sm font-semibold text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 transition-colors disabled:opacity-50"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? '注册中...' : '注册'}
                </button>
              </div>
            </form>
            <p className="mt-8 text-center text-sm text-gray-600">
              已经有账户了？
              <Link className="font-medium text-gray-800 hover:text-gray-700 underline" href="/sign-in">
                登录
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
