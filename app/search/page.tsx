"use client";

import React, { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react';
import Link from 'next/link';
import Header from '../../components/layout/Header';
import Image from 'next/image';
import { Book } from '../../types/book';
import {get} from '@/lib/apiClient'; 

// 模拟后端 API 调用
const fetchHotBooks = async (): Promise<Book[]> => {
  return await get<Book[]>('/books/search/hot'); // 假设有一个 API 返回热门图书
};

const searchBooksAPI = async (query: string): Promise<Book[]> => {
  return await get<Book[]>(`/books/search/keywords?q=${encodeURIComponent(query)}`);
};

export default function SearchPage() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayedBooks, setDisplayedBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false); // 用于区分初始热搜和主动搜索
  const [isInputFocused, setIsInputFocused] = useState(false); // 新增：控制搜索框整体聚焦样式

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const loadInitialBooks = async () => {
      setIsLoading(true);
      try {
        const books = await fetchHotBooks();
        setDisplayedBooks(books);
        setIsSearching(false);
      } catch (error) {
        console.error("获取热搜图书失败:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialBooks();
  }, []);

  const handleSearchSubmit = async (event?: FormEvent<HTMLFormElement> | KeyboardEvent<HTMLInputElement>) => {
    if (event && 'preventDefault' in event) {
      event.preventDefault();
    }
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setIsSearching(true);
    try {
      const results = await searchBooksAPI(searchTerm);
      setDisplayedBooks(results);
    } catch (error) {
      console.error("搜索图书失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearchSubmit(event);
    }
  };

  const BookCard = ({ book }: { book: Book }) => (
    <Link href={`/book/${book.id}`} key={book.id} className="block group">
      <div className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-white flex flex-col h-full">
        {book.cover ? (
          <div className="relative w-full aspect-[6/7] sm:aspect-[7/8] md:aspect-[6/7]"> {/* 调整图片容器宽高比，使其更宽 */}
            <Image src={book.cover} alt={book.title} layout="fill" objectFit="cover" className="bg-gray-100" />
          </div>
        ) : (
          <div className="w-full aspect-[4/5] sm:aspect-[5/6] md:aspect-[4/5] bg-gray-200 flex items-center justify-center text-gray-500"> {/* 调整占位符宽高比 */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="p-3 sm:p-4 flex flex-col flex-grow">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 group-hover:text-sky-600 transition-colors truncate" title={book.title}>{book.title}</h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate" title={book.author}>作者：{book.author}</p>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-neutral-100 group/design-root overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <Header />
        <main className="px-4 sm:px-6 md:px-8 lg:px-10 flex flex-1 justify-center py-8">
          <div className="layout-content-container flex flex-col w-full max-w-5xl flex-1">
            <div className="px-4 py-6">
              <form onSubmit={handleSearchSubmit} className="flex flex-col min-w-40 h-12 w-full max-w-xl mx-auto">
                <div 
                  className={`flex w-full flex-1 items-stretch rounded-lg h-full shadow-md border transition-all duration-150 ease-in-out ${isInputFocused ? 'ring-2 ring-neutral-600 border-neutral-600 bg-white' : 'bg-white border-neutral-300 hover:border-neutral-400'}`}
                >
                  <div className={`text-neutral-500 flex items-center justify-center pl-4 rounded-l-lg transition-colors ${isInputFocused ? 'text-neutral-700' : 'text-neutral-500'}`}>
                    <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                    </svg>
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyDown}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    placeholder="搜索书名、作者..."
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-none text-neutral-900 focus:outline-none border-0 bg-transparent h-full placeholder:text-neutral-500 px-4 text-base font-normal leading-normal"
                  />
                  <button type="submit" className={`flex items-center justify-center rounded-r-lg border-0 text-white px-6 transition-colors font-medium ${isInputFocused ? 'bg-neutral-700 hover:bg-neutral-800' : 'bg-neutral-600 hover:bg-neutral-700'}`}>
                    搜索
                  </button>
                </div>
              </form>
            </div>
            <div className="px-4 py-6">
              {isLoading ? (
                <div className="text-center py-10 text-neutral-500">加载中...</div>
              ) : (
                <>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-slate-800">
                    {isSearching ? '搜索结果' : '热门搜索'}
                  </h2>
                  {displayedBooks.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                      {displayedBooks.map(book => (
                        <BookCard key={book.id} book={book} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-10">
                      {isSearching ? '未找到相关图书。' : '暂无热门搜索内容。'}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
