'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { post } from '@/lib/apiClient';

interface FavoriteButtonProps {
  bookId: number;
}

export default function FavoriteButtonClient({ bookId }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false); // True if successfully favorited by this action
  const [isLoading, setIsLoading] = useState(false);

  const handleAddFavorite = async () => {
      console.log('handleAddFavorite called with bookId:', bookId); // 新增的日志
    // If you want to prevent multiple clicks after a successful favorite action in this session:
    if (isFavorited) {
      toast.success('您已将此书加入收藏。');
      return;
    }

    setIsLoading(true);
    try {
      await post(`/book/collections/add/${bookId}`, {},);

      setIsFavorited(true); // Update state to reflect that the book is now favorited
      toast.success('已成功收藏！');

    } catch (error) {
      console.error('Failed to add favorite:', error);
      // 您可能需要根据后端返回的错误类型进行更具体的错误处理
      // 例如，如果后端返回错误码表示已收藏，则可以相应更新UI
      toast.error('收藏失败，请稍后再试。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddFavorite}
      disabled={isLoading || isFavorited} // Disable button if loading or if successfully favorited
      className="w-full max-w-[200px] flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md h-10 px-5 bg-neutral-900 text-white text-sm font-bold leading-normal tracking-wide hover:bg-neutral-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isLoading ? '处理中...' : (isFavorited ? '已收藏' : '收藏')}
    </button>
  );
}
