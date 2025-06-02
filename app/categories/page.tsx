'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import { get } from '@/lib/apiClient';

interface ApiBook {
  id: string;
  title: string;
  author: string;
  publisher?: string;
  publishedDate?: string;
  cover?: string;
}


const predefinedCategories = [
  '文学', '历史', '哲学', '艺术', '科技', 
  '教育', '管理', '经济', '生活', '传记',
  '计算机', '医学', '法律', '社科', '其他'
];

export default function CategoriesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>("文学");
  const [books, setBooks] = useState<ApiBook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCategory) {
      const fetchBooksByCategory = async () => {
        setIsLoading(true);
        setError(null);
        setBooks([]);
        try {   
          const response = await get< ApiBook[]>(`/books/search/category?category=${selectedCategory}`);
          setBooks(response || []);
        } catch (err) {
          console.error(`Error fetching books for category ${selectedCategory}:`, err);
          setError(`无法加载分类 "${selectedCategory}" 下的图书。请稍后再试。`);
        } finally {
          setIsLoading(false);
        }
      };
      fetchBooksByCategory();
    }
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-neutral-800 mb-8 text-center">图书分类</h1>
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-neutral-700 mb-4">选择分类:</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {predefinedCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors
                  ${selectedCategory === category 
                    ? 'bg-neutral-800 text-white' // Selected: dark gray background, white text
                    : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'} // Not selected: light gray background, dark gray text
                `}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {selectedCategory && (
          <div>
            <h2 className="text-2xl font-bold text-neutral-800 mb-6">
              分类: {selectedCategory}
            </h2>
            {isLoading && (
              <div className="text-center py-10">
                <p className="text-lg text-neutral-600">正在加载图书...</p>
              </div>
            )}
            {error && (
              <div className="text-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">出错了!</strong>
                <span className="block sm:inline"> {error}</span>
              </div>
            )}
            {!isLoading && !error && books.length === 0 && (
              <p className="text-center text-neutral-600 py-10">
                此分类下暂无图书。
              </p>
            )}
            {!isLoading && !error && books.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {books.map((book) => (
                  <Link key={book.id} href={`/book-detail/${book.id}`} className="block bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
                    {/* <a className="block bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group"> */}
                      <div className="relative w-full h-82 bg-neutral-200">
                        <Image
                          src={book.cover || '/announcement.png'}
                          alt={`封面: ${book.title}`}
                          layout="fill"
                          objectFit="cover"
                          className="group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-neutral-800 truncate group-hover:neutral-900" title={book.title}>
                          {book.title}
                        </h3>
                        <p className="text-sm text-neutral-600 truncate" title={book.author}>
                          作者: {book.author}
                        </p>
                      </div>
                    {/* </a> */}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
        {!selectedCategory && (
            <div className="text-center py-20">
                <p className="text-xl text-neutral-500">请从上方选择一个图书分类进行浏览。</p>
            </div>
        )}
      </main>
    </div>
  );
}
