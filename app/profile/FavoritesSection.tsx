'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { get, del } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import Link from 'next/link';

export interface FavoriteBook {
  id: number; 
  title: string;
  author: string;
  publisher: string;
  publishedDate: string;
  cover: string;
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch  {
    return dateString;
  }
};

export default function FavoritesSection() {
  const [favorites, setFavorites] = useState<FavoriteBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const { isAuthenticated } = useAuthStore();

  const fetchFavorites = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const responseData = await get<FavoriteBook[]>('/book/collections/list');
      setFavorites(responseData || []);
    } catch (err: unknown) {
      console.error('Failed to fetch favorites:', err);
      const errorMessage = (err instanceof Error && err.message) ? err.message : '无法加载收藏列表。请稍后再试。';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    fetchFavorites();
  }, [isAuthenticated]);

  const handleRemoveFavorite = async (bookId: number) => {
    if (!isAuthenticated) {
      toast.error('请先登录再操作。');
      return;
    }
    setRemovingId(bookId);
    try {
      await del(`/book/collections/remove/${bookId}`);
      toast.success('已成功移除收藏！');
      setFavorites(prev => prev.filter(book => book.id !== bookId));
    } catch (err: unknown) {
      console.error('Failed to remove favorite:', err);
      const errorMessage = (err instanceof Error && err.message) ? err.message : '移除收藏失败。';
      toast.error(errorMessage);
    } finally {
      setRemovingId(null);
    }
  };
  
  if (!isAuthenticated && !isLoading) {
     return (
      <div className="bg-white shadow-md rounded-lg p-6 text-center">
        <p className="text-gray-600">请先<a href="/sign-in" className="text-blue-500 hover:underline">登录</a>查看收藏列表。</p>
      </div>
    );
  }

  if (isLoading && favorites.length === 0) { 
    return <div className="text-center p-10 text-gray-700">加载收藏列表中...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">错误: {error}</div>;
  }

  if (favorites.length === 0 && !isLoading) { 
    return <div className="text-center p-10 text-gray-500">暂无收藏记录。</div>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-4 md:p-6">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">我的收藏</h2>
      <div className="space-y-6">
        {favorites.map((book) => (
          <Link href={`/book-detail/${book.id}`} key={book.id}>
            <div className="flex flex-col md:flex-row items-start md:items-center p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow duration-150">
              <div className="flex-shrink-0 w-20 h-30 md:w-24 md:h-36 mr-0 md:mr-6 mb-4 md:mb-0">
                <Image
                  src={book.cover || '/placeholder-cover.png'} // Ensure placeholder-cover.png is in /public
                  alt={`封面: ${book.title}`}
                  width={96}
                  height={144}
                  className="rounded object-cover w-full h-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                  target.srcset = '/placeholder-cover.png';
                  target.src = '/placeholder-cover.png';
                }}
              />
            </div>
            <div className="flex-grow">
              <h3 className="text-lg font-semibold text-blue-700 hover:text-blue-800 transition-colors">{book.title}</h3>
              <p className="text-sm text-gray-600 mt-1">作者: {book.author}</p>
              <p className="text-sm text-gray-600">出版社: {book.publisher}</p>
              <p className="text-sm text-gray-600">出版日期: {formatDate(book.publishedDate)}</p>
            </div>
            <div className="mt-4 md:mt-0 md:ml-6 flex-shrink-0">
              <button
                onClick={() => handleRemoveFavorite(book.id)}
                disabled={removingId === book.id}
                className="px-4 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {removingId === book.id ? '移除中...' : '移除收藏'}
              </button>
            </div>
          </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
