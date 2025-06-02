'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { get } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import useAuthStore from '@/store/authStore';

interface User {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  avatar: string | null;
}

interface Book {
  id: number;
  title: string;
  author: string;
  publisher: string;
  publishedDate: string;
  cover: string;
  barcode: string;
}

interface OverdueRecord {
  id: number;
  user: User;
  book: Book;
  borrowDate: string;
  dueDate: string;
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

export default function OverdueRecordsSection() {
  const [records, setRecords] = useState<OverdueRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ROLE_ADMIN') {
      setIsLoading(false);
      setError('您没有权限查看此内容。');
      return;
    }

    const fetchOverdueRecords = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const responseData = await get<OverdueRecord[]>('/books/search/overdue');
        setRecords(responseData || []);
      } catch (err: unknown) {
        console.error('Failed to fetch overdue records:', err);
        const errorMessage = (err instanceof Error && err.message) ? err.message : '无法加载逾期记录。请稍后再试。';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOverdueRecords();
  }, [isAuthenticated, user?.role]);

  if (isLoading) {
    return <div className="text-center p-10 text-gray-700">加载逾期记录中...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">错误: {error}</div>;
  }

  if (records.length === 0) {
    return <div className="text-center p-10 text-gray-500">暂无逾期记录。</div>;
  }

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">逾期记录查询</h2>
      <div className="space-y-8">
        {records.map((record) => (
          <div key={record.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-150">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Book Details */}
              <div className="md:col-span-2">
                <h3 className="text-xl font-semibold text-blue-700 mb-2">{record.book.title}</h3>
                <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-24 h-36 relative">
                        <Image
                        src={record.book.cover || '/placeholder-cover.png'}
                        alt={`封面: ${record.book.title}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="rounded object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.srcset = '/placeholder-cover.png';
                            target.src = '/placeholder-cover.png';
                        }}
                        />
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">作者: {record.book.author}</p>
                        <p className="text-sm text-gray-600">出版社: {record.book.publisher}</p>
                        <p className="text-sm text-gray-600">出版日期: {formatDate(record.book.publishedDate)}</p>
                        <p className="text-sm text-gray-600">条形码: {record.book.barcode}</p>
                        <p className="text-sm text-red-500 font-semibold mt-2">应还日期: {formatDate(record.dueDate)}</p>
                        <p className="text-sm text-gray-500">借阅日期: {formatDate(record.borrowDate)}</p>
                    </div>
                </div>
              </div>

              {/* User Details */}
              <div>
                <h4 className="text-lg font-semibold text-gray-700 mb-3 pt-2 border-t md:border-t-0 md:pt-0">借阅用户信息</h4>
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
                        <Image
                        src={record.user.avatar || '/avatar.png'}
                        alt={`${record.user.username} 的头像`}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.srcset = '/avatar.png';
                            target.src = '/avatar.png';
                        }}
                        />
                    </div>
                    <div>
                        <p className="text-md font-medium text-gray-800">{record.user.username}</p>
                        <p className="text-xs text-gray-500">ID: {record.user.id}</p>
                    </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">邮箱: {record.user.email || '未提供'}</p>
                <p className="text-sm text-gray-600">电话: {record.user.phone || '未提供'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
