'use client';

import React, { useState } from 'react';
import useAuthStore from '@/store/authStore';
import { post } from '@/lib/apiClient'; // 导入 post 方法
import { toast } from 'react-hot-toast'; // 导入 toast 用于提示
import { ApiError } from '@/lib/errors'; // 导入 ApiError

export default function AddBookSection() {
  const { isAuthenticated, user } = useAuthStore();
  const [isbn, setIsbn] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthenticated || user?.role !== 'ROLE_ADMIN') {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 text-center">
        <p className="text-red-500">您没有权限访问此页面。</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isbn.trim()) {
      toast.error('请输入图书的ISBN号。');
      return;
    }
    setIsLoading(true);
    try {
      // API路径为 /books/new/{isbn}
      await post(`/books/new/${isbn}`, {}); // 第二个参数为空对象，因为此API不需要请求体
      toast.success('图书添加成功！');
      setIsbn(''); // 清空输入框      
    } catch (error: unknown) { // 使用 unknown 类型
      console.error('添加图书失败:', error);
      let errorMessage = '添加图书失败，请检查ISBN或稍后再试。';
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
      <h2 className="text-3xl font-bold mb-8 text-gray-800">添加新图书 (通过ISBN)</h2>
      <div className="max-w-xl mx-auto">
        <p className="text-gray-600 mb-6">
          输入图书的ISBN号以添加新书。系统将根据ISBN自动获取图书信息。
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="isbn" className="block text-sm font-medium text-gray-700">ISBN</label>
            <input 
              type="text" 
              name="isbn" 
              id="isbn" 
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="请输入图书的ISBN号"
              required
            />
          </div>
          
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isLoading || !isbn.trim()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '添加中...' : '添加图书'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
