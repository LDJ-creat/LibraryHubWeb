'use client';

import React, { useEffect, useState, FormEvent } from 'react';
import Image from 'next/image';
import useAuthStore from '@/store/authStore';
import { get, post } from '@/lib/apiClient'; // Added post
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation'; // 确保导入 useRouter

interface UserProfileData {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: string;
}

export default function UserProfileSection() {
  const { isAuthenticated, setUser: setAuthUser, user: authUser, clearAuth } = useAuthStore(); // 添加 clearAuth
  const router = useRouter(); // 初始化 router
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for avatar change
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  // States for password change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // 新增退出登录加载状态

  const fetchUserProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await get<UserProfileData>('/auth/user');
      setProfileData(data);
      // Optionally, ensure authStore is also up-to-date if it could be stale
      // This depends on how authUser is initially populated and managed
      if (data && authUser && String(data.id) === String(authUser.id)) {
        setAuthUser({ ...authUser, username: data.username, avatar: data.avatar ?? undefined });
      }
    } catch (err: unknown) {
      console.error('Failed to fetch user profile:', err);
      const errorMessage = (err instanceof Error && err.message) ? err.message : '无法加载个人信息。请稍后再试。';
      setError(errorMessage);
      // toast.error(errorMessage); // Avoid double toast if page load fails
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    fetchUserProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleUpdateAvatar = async () => {
    if (!newAvatarUrl.trim()) {
      toast.error('请输入新的头像 URL。');
      return;
    }
    setIsUpdatingAvatar(true);
    try {
      await post('/auth/avatar', { avatar: newAvatarUrl });
      toast.success('头像更新成功！');
      setProfileData(prev => prev ? { ...prev, avatar: newAvatarUrl } : null);
      // Update avatar in authStore as well for global reflection (Header, Sidebar)
      if (authUser) {
        setAuthUser({ ...authUser, avatar: newAvatarUrl });
      }
      setNewAvatarUrl('');
    } catch (err: unknown) {
      console.error('Failed to update avatar:', err);
      const errorMessage = (err instanceof Error && err.message) ? err.message : '头像更新失败。';
      toast.error(errorMessage);
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleUpdatePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      toast.error('所有密码字段均为必填项。');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('新密码和确认密码不匹配。');
      return;
    }
    if (newPassword.length < 6) { // Example: Basic password length validation
        toast.error('新密码长度至少为6位。');
        return;
    }

    setIsUpdatingPassword(true);
    try {
      await post('/auth/password', { oldPassword, newPassword });
      toast.success('密码更新成功！');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: unknown) {
      console.error('Failed to update password:', err);
      const errorMessage = (err instanceof Error && err.message) ? err.message : '密码更新失败。';
      toast.error(errorMessage);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await post('/auth/logout', {});
      toast.success('已成功退出登录。');
      clearAuth(); // 清除认证状态
      router.push('/sign-in'); // 重定向到登录页
    } catch (err: unknown) {
      console.error('Failed to logout:', err);
      const errorMessage = (err instanceof Error && err.message) ? err.message : '退出登录失败，请稍后再试。';
      toast.error(errorMessage);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!isAuthenticated && !isLoading && !profileData) { // Adjusted condition
    return (
      <div className="bg-white shadow-md rounded-lg p-6 text-center">
        <p className="text-gray-600">请先<a href="/sign-in" className="text-blue-500 hover:underline">登录</a>查看个人信息。</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center p-10 text-gray-700">加载个人信息中...</div>;
  }

  if (error && !profileData) { // Show error only if profileData is not loaded
    return <div className="text-center p-10 text-red-500">错误: {error}</div>;
  }

  if (!profileData) {
    // This case might be hit if not authenticated and not loading, handled above, 
    // or if fetch succeeded but returned no data (which shouldn't happen for /auth/user if authenticated)
    return <div className="text-center p-10 text-gray-500">未能加载个人信息或用户未登录。</div>;
  }

  // 横向铺开，左对齐风格
  return (
    <div className="w-full bg-white shadow-lg rounded-xl p-8 flex flex-col md:flex-row gap-10 items-start">
      {/* 左侧头像和用户名 */}
      <div className="flex flex-col items-center min-w-[200px] md:pr-8 border-r border-gray-100">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-200 shadow-md mb-4">
          <Image
            src={profileData.avatar || '/avatar.png'}
            alt={`${profileData.username} 的头像`}
            width={128}
            height={128}
            className="object-cover w-full h-full"
            key={profileData.avatar}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.srcset = '/avatar.png';
              target.src = '/avatar.png';
            }}
          />
        </div>
        <h3 className="text-2xl font-semibold text-gray-700">{profileData.username}</h3>
      </div>

      {/* 右侧信息内容 */}
      <div className="flex-1 w-full">
        <h2 className="text-3xl font-bold mb-8 text-gray-800">个人信息</h2>
        <div className="space-y-6 mb-10">
          {(Object.keys(profileData) as Array<keyof UserProfileData>)
            .filter(key => key !== 'avatar' && key !== 'username')
            .map(key => {
              const labels: Record<keyof UserProfileData, string> = {
                id: '用户ID',
                username: '用户名',
                email: '邮箱',
                phone: '电话',
                role: '角色',
                avatar: '',
              };
              const value = profileData[key];
              if (key === 'id' || key === 'email' || key === 'phone' || key === 'role') {
                return (
                  <div key={key} className="max-w-xl">
                    <label className="block text-sm font-semibold text-gray-500 mb-1">{labels[key]}:</label>
                    <p className="text-md text-gray-800 bg-slate-50 p-3 rounded-lg shadow-sm">{String(value) || '未提供'}</p>
                  </div>
                );
              }
              return null;
            })}
        </div>

        {/* 修改头像 */}
        <div className="mt-10 pt-8 border-t border-gray-200 max-w-xl">
          <h3 className="text-xl font-semibold text-gray-700 mb-5">修改头像</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="avatarUrl" className="block text-sm font-semibold text-gray-500 mb-1">新头像 URL:</label>
              <input
                type="text"
                id="avatarUrl"
                value={newAvatarUrl}
                onChange={(e) => setNewAvatarUrl(e.target.value)}
                placeholder="例如: https://example.com/avatar.png"
                className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50"
              />
            </div>
            <button
              onClick={handleUpdateAvatar}
              disabled={isUpdatingAvatar}
              className="w-full px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isUpdatingAvatar ? '更新中...' : '更新头像'}
            </button>
          </div>
        </div>

        {/* 修改密码 */}
        <div className="mt-10 pt-8 border-t border-gray-200 max-w-xl">
          <h3 className="text-xl font-semibold text-gray-700 mb-5">修改密码</h3>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label htmlFor="oldPassword" className="block text-sm font-semibold text-gray-500 mb-1">旧密码:</label>
              <input
                type="password"
                id="oldPassword"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-500 mb-1">新密码:</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50"
              />
            </div>
            <div>
              <label htmlFor="confirmNewPassword" className="block text-sm font-semibold text-gray-500 mb-1">确认新密码:</label>
              <input
                type="password"
                id="confirmNewPassword"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50"
              />
            </div>
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="w-full px-4 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isUpdatingPassword ? '更新中...' : '修改密码'}
            </button>
          </form>
        </div>

        {/* 退出登录 */}
        <div className="mt-10 pt-8 border-t border-gray-200 max-w-xl">
          <h3 className="text-xl font-semibold text-gray-700 mb-5">账户操作</h3>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full px-4 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? '正在退出...' : '退出登录'}
          </button>
        </div>

      </div>
    </div>
  );
}
