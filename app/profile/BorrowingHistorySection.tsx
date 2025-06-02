'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { get } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import Link from 'next/link';


export interface BorrowedBook {
  id: number;
  title: string;
  author: string;
  publisher: string;
  publishedDate: string;
  cover: string;
  createTime: string; // Borrow date
  returnDate: string | null;
  dueDate: string;
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateString;
  }
};

const getBorrowStatus = (item: BorrowedBook): { text: string; color: string } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); 

  if (item.returnDate) {
    return { text: `已于 ${formatDate(item.returnDate)} 归还`, color: 'text-green-600' };
  }

  try {
    const dueDate = new Date(item.dueDate);
    dueDate.setHours(0, 0, 0, 0); 

    if (dueDate < today) {
      return { text: '已逾期', color: 'text-red-600 font-bold' };
    }
    return { text: '未归还', color: 'text-yellow-600 font-semibold' };
  } catch {
    // If dueDate is invalid
    return { text: '日期无效', color: 'text-gray-500' };
  }
};


export default function BorrowingHistorySection() {
  const [history, setHistory] = useState<BorrowedBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const responseData = await get<BorrowedBook[]>('/books/myBorrowRecords');
        setHistory(responseData || []); 
      } catch (err: unknown) {
        console.error('Failed to fetch borrowing history:', err);
        const errorMessage = (err instanceof Error && err.message) ? err.message : '无法加载借阅历史。请稍后再试。';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [isAuthenticated]);

  if (!isAuthenticated && !isLoading) {
     return (
      <div className="bg-white shadow-md rounded-lg p-6 text-center">
        <p className="text-gray-600">请先<a href="/sign-in" className="text-blue-500 hover:underline">登录</a>查看借阅历史。</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center p-10 text-gray-700">加载借阅历史中...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">错误: {error}</div>;
  }

  if (history.length === 0) {
    return <div className="text-center p-10 text-gray-500">暂无借阅记录。</div>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-4 md:p-6">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">借阅历史</h2>
      <div className="space-y-6">
        {history.map((item) => {
          const status = getBorrowStatus(item);
          return (
            <Link key={item.id} href={`/books/${item.id}`} className="block hover:bg-gray-100 rounded-lg p-4 transition-colors duration-150">
            <div key={item.id} className="flex flex-col md:flex-row items-start md:items-center p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow duration-150">
              <div className="flex-shrink-0 w-20 h-30 md:w-24 md:h-36 mr-0 md:mr-6 mb-4 md:mb-0">
                <Image
                  src={item.cover || '/placeholder-cover.png'} // Ensure placeholder-cover.png is in /public
                  alt={`封面: ${item.title}`}
                  width={96} // md:w-24
                  height={144} // md:h-36
                  className="rounded object-cover w-full h-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.srcset = '/placeholder-cover.png'; // Fallback for next/image
                    target.src = '/placeholder-cover.png';
                  }}
                />
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-blue-700 hover:text-blue-800 transition-colors">{item.title}</h3>
                <p className="text-sm text-gray-600 mt-1">作者: {item.author}</p>
                <p className="text-sm text-gray-600">出版社: {item.publisher}</p>
                <p className="text-sm text-gray-600">出版日期: {formatDate(item.publishedDate)}</p>
                <p className="text-sm text-gray-500 mt-2">借阅日期: {formatDate(item.createTime)}</p>
                <p className="text-sm text-gray-500">应还日期: {formatDate(item.dueDate)}</p>
              </div>
              <div className="mt-4 md:mt-0 md:ml-6 text-left md:text-right flex-shrink-0">
                <p className={`text-md ${status.color}`}>{status.text}</p>
              </div>
            </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
