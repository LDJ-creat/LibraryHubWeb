'use client';

import React, { useState } from 'react';
import useAuthStore from '@/store/authStore';
import { post } from '@/lib/apiClient'; // 导入 post 方法
import { toast } from 'react-hot-toast'; // 导入 toast 用于提示
import { ApiError } from '@/lib/errors'; // 导入 ApiError

interface NewAdminData {
  email: string;
  isRoot: boolean;
  password: string;
  phone: string;
  username: string;
}

export default function AddAdminSection() {
  const { isAuthenticated, user } = useAuthStore();
  const [formData, setFormData] = useState<NewAdminData>({
    email: '',
    isRoot: false,
    password: '',
    phone: '',
    username: ''
  });
  const [confirmPassword, setConfirmPassword] = useState(''); // 新增确认密码状态
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthenticated || user?.role !== 'ROLE_ADMIN') {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 text-center">
        <p className="text-red-500">您没有权限访问此页面。</p>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
        toast.error('用户名、邮箱和密码不能为空。');
        return;
    }
    if (formData.password !== confirmPassword) { // 新增密码校验逻辑
        toast.error('两次输入的密码不一致。');
        return;
    }
    setIsLoading(true);
    try {
      await post<NewAdminData, unknown>('/auth/new/admin', formData);
      toast.success(`管理员 ${formData.username} 添加成功！`);
      // 重置表单
      setFormData({
        email: '',
        isRoot: false,
        password: '',
        phone: '',
        username: ''
      });
      setConfirmPassword(''); // 重置确认密码字段
      toast.success('新管理员账号已成功添加！');
    } catch (error: unknown) { // 使用 unknown 类型
      console.error('添加管理员失败:', error);
      let errorMessage = '添加管理员失败，请稍后再试。';
      if (error instanceof ApiError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">添加新管理员账号</h2>
      <div className="max-w-xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">用户名 <span className="text-red-500">*</span></label>
            <input type="text" name="username" id="username" value={formData.username} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="请输入用户名" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">邮箱 <span className="text-red-500">*</span></label>
            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="请输入邮箱地址" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">密码 <span className="text-red-500">*</span></label>
            <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="请输入初始密码" />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">确认密码 <span className="text-red-500">*</span></label>
            <input type="password" name="confirmPassword" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="请再次输入密码" />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">电话号码</label>
            <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="请输入电话号码 (可选)" />
          </div>
          <div className="flex items-center">
            <input type="checkbox" name="isRoot" id="isRoot" checked={formData.isRoot} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
            <label htmlFor="isRoot" className="ml-2 block text-sm text-gray-900">设为超级管理员 (isRoot)</label>
          </div>
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isLoading || !formData.username || !formData.email || !formData.password || !confirmPassword}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '添加中...' : '添加管理员'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
