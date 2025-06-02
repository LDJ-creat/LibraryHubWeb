'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Book, BookReview, BookCopies, BookSearchResult } from '@/types/book';
import { toast } from 'react-hot-toast';
import { get, post } from '@/lib/apiClient'; 
import useAuthStore from '@/store/authStore';
interface BookDetailClientContentProps {
  book: Book;
}

type TabName = 'overview' | 'reviews' | 'similar-books';

interface ApiComment {
  id: number;
  avatar: string;
  username: string;
  content: string;
  updateTime: string; // Date string
  rating: number;
}

interface ApiRecommendation {
  id: number;
  title: string;
  author: string;
  cover: string;
}


export default function BookDetailClientContent({ book }: BookDetailClientContentProps) {
  const { user } = useAuthStore(); // Get the current user from Zustand store
  const [activeTab, setActiveTab] = useState<TabName>('overview');
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [newReviewText, setNewReviewText] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  // State for reviews and recommendations, initialized with data from props
  const [reviews, setReviews] = useState<BookReview[]>(book.reviews || []);
  const [recommendations, setRecommendations] = useState<BookSearchResult[]>(book.recommendations || []);

  // State for pagination
  const [reviewsPage, setReviewsPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(true); // Assume more reviews might be available
  const [recommendationsPage, setRecommendationsPage] = useState(1);
  const [hasMoreRecommendations, setHasMoreRecommendations] = useState(true); // Assume more recommendations might be available
  const [isLoadingMoreReviews, setIsLoadingMoreReviews] = useState(false);
  const [isLoadingMoreRecommendations, setIsLoadingMoreRecommendations] = useState(false);

  // State for dynamic rating summary
  const [currentRatingAvg, setCurrentRatingAvg] = useState(book.ratingAvg || 0);
  const [currentRatingCount, setCurrentRatingCount] = useState(book.ratingCount || 0);
  const [currentRatingDistribution, setCurrentRatingDistribution] = useState<number[]>(book.ratingDistribution || [0, 0, 0, 0, 0]);

  // Update local state if book prop changes
  useEffect(() => {
    setReviews(book.reviews || []);
    setRecommendations(book.recommendations || []);
    setReviewsPage(1);
    setHasMoreReviews((book.reviews?.length || 0) < 5 ? false : true);
    setRecommendationsPage(1);
    setHasMoreRecommendations((book.recommendations?.length || 0) < 3 ? false : true);

    // Initialize/update rating summary states when book prop changes
    setCurrentRatingAvg(book.ratingAvg || 0);
    setCurrentRatingCount(book.ratingCount || 0);
    setCurrentRatingDistribution(book.ratingDistribution || [0, 0, 0, 0, 0]);
  }, [book]);

  const getPercentage = (count: number) => {
    // Use currentRatingCount for dynamic updates
    if (!currentRatingCount || currentRatingCount === 0) return 0;
    return Math.round((count / currentRatingCount) * 100);
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewRating || !newReviewText.trim() || !user) {
      toast.error('请提供评分和评论内容，并确保您已登录。');
      return;
    }

    try {
      await post(`/books/newComment/top`, {
        bookId: book.id,
        rating: newReviewRating,
        content: newReviewText
      });

      // Update rating distribution and count
      const newTotalCount = currentRatingCount + 1;
      const updatedDistribution = [...currentRatingDistribution];
      if (newReviewRating >= 1 && newReviewRating <= 5) {
        updatedDistribution[newReviewRating - 1]++;
      }

      // Recalculate average rating
      let totalScore = 0;
      updatedDistribution.forEach((count, index) => {
        totalScore += (index + 1) * count;
      });
      const newAverage = newTotalCount > 0 ? totalScore / newTotalCount : 0;

      setCurrentRatingDistribution(updatedDistribution);
      setCurrentRatingCount(newTotalCount);
      setCurrentRatingAvg(newAverage);

      // Add new review to the list
      const newReviewEntry: BookReview = {
        id: Date.now(), // Temporary unique ID
        userName: user.username,
        userAvatar: user.avatar || '/avatar.png',
        rating: newReviewRating,
        commentText: newReviewText,
        commentDate: new Date().toISOString(),
      };
      setReviews([newReviewEntry, ...reviews]);

      setNewReviewRating(0);
      setNewReviewText('');
      toast.success('评论已提交！');
    } catch (error) {
      console.error('Failed to post review:', error);
      toast.error('提交评论失败，请稍后再试。');
    }
  };

  const fetchMoreReviews = async () => {
    if (!hasMoreReviews || isLoadingMoreReviews) return;
    setIsLoadingMoreReviews(true);
    try {
      const newApiComments = await get<ApiComment[]>(`i/books/relatedComments?bookId=${book.id}&currentPage=${reviewsPage}&pageSize=5`); 
      
      if (newApiComments && newApiComments.length > 0) {
        const newReviews = newApiComments.map((comment: ApiComment): BookReview => ({
          id: comment.id,
          userAvatar: comment.avatar || undefined,
          userName: comment.username,
          rating: comment.rating,
          commentText: comment.content,
          commentDate: comment.updateTime,
        }));
        setReviews(prevReviews => [...prevReviews, ...newReviews]);
        setReviewsPage(prevPage => prevPage + 1);
        setHasMoreReviews(newReviews.length === 5); // 暂时设置为每次加载5条评论，如果API返回的数量小于5，则认为没有更多评论了
      } else {
        setHasMoreReviews(false);
      }
    } catch (error) {
      console.error('Failed to fetch more reviews:', error);
      setHasMoreReviews(false); 
    } finally {
      setIsLoadingMoreReviews(false);
    }
  };

  const fetchMoreRecommendations = async () => {
    if (!hasMoreRecommendations || isLoadingMoreRecommendations) return;
    setIsLoadingMoreRecommendations(true);
    try {
      console.log('Fetching more recommendations (mock for now)...');
      const newApiRecommendations = await get<ApiRecommendation[]>(`/books/relatedBooks?bookId=${book.id}&currentPage=${recommendationsPage}&pageSize=3`);
      if(newApiRecommendations && newApiRecommendations.length > 0){
        const newRecommendations = newApiRecommendations.map((rec: ApiRecommendation): BookSearchResult => ({
          id: rec.id,
          title: rec.title,
          author: rec.author,
          cover: rec.cover,
        }));
      
        setRecommendations(prevRecs => [...prevRecs,...newRecommendations]);
        setRecommendationsPage(prevPage => prevPage + 1);
        setHasMoreRecommendations(newApiRecommendations.length == 5);
      }else{
        setHasMoreRecommendations(false);
      }

    } catch (error) {
      console.error('Failed to fetch more recommendations:', error);
      setHasMoreRecommendations(false);
    } finally {
      setIsLoadingMoreRecommendations(false);
    }
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <svg
        key={i}
        className={`size-5 ${i < rating ? 'text-yellow-400' : 'text-neutral-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.387 2.458a1 1 0 00-.364 1.118l1.287 3.971c.3.921-.755 1.688-1.54 1.118l-3.387-2.458a1 1 0 00-1.175 0l-3.387 2.458c-.784.57-1.838-.197-1.539-1.118l1.287-3.971a1 1 0 00-.364-1.118L2.28 9.398c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.97z" />
      </svg>
    ));
  };

  return (
    <>
      <div className="border-b border-neutral-200 mb-6">
        <nav aria-label="Tabs" className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            图书详情
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'reviews'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            图书评论
          </button>
          <button
            onClick={() => setActiveTab('similar-books')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'similar-books'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            相关推荐
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div>
        {activeTab === 'overview' && (
          <>
            <section id="overview-synopsis" className="mb-8">
              <h2 className="text-neutral-900 text-2xl font-bold leading-tight tracking-tight mb-3">图书简介</h2>
              <p className="text-neutral-700 text-base leading-relaxed whitespace-pre-line">
                {book.description}
              </p>
            </section>
            <section id="overview-publication" className="mb-8">
              <h2 className="text-neutral-900 text-2xl font-bold leading-tight tracking-tight mb-4">出版信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 border-t border-neutral-200 pt-4">
                <div>
                  <p className="text-sm text-neutral-500">出版社</p>
                  <p className="text-base text-neutral-900 font-medium">{book.publisher}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">出版日期</p>
                  <p className="text-base text-neutral-900 font-medium">{new Date(book.publishedDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">类别</p>
                  <p className="text-base text-neutral-900 font-medium">{book.category}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">ISBN</p>
                  <p className="text-base text-neutral-900 font-medium">{book.isbn}</p>
                </div>
              </div>
            </section>
            {/* 新增图书规格信息区域 */}
            <section id="overview-specifications" className="mb-8">
              <h2 className="text-neutral-900 text-2xl font-bold leading-tight tracking-tight mb-4">图书规格</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 border-t border-neutral-200 pt-4">
                <div>
                  <p className="text-sm text-neutral-500">位置 / 索书号</p>
                  <p className="text-base text-neutral-900 font-medium">
                    {book.location || 'N/A'} - {book.callNumber || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">价格</p>
                  <p className="text-base text-neutral-900 font-medium">
                    {book.price ? `¥${book.price}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">版本</p>
                  <p className="text-base text-neutral-900 font-medium">{book.edition || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">页数</p>
                  <p className="text-base text-neutral-900 font-medium">{book.pages || 'N/A'} </p>
                </div>
              </div>
            </section>
            <section id="overview-availability" className="mb-8">
              <h2 className="text-neutral-900 text-2xl font-bold leading-tight tracking-tight mb-4">可借副本 ({book.bookCopies.length})</h2>
              {book.bookCopies.length > 0 ? (
                <div className="space-y-4 border-t border-neutral-200 pt-4">
                  {book.bookCopies.map((copy: BookCopies) => (
                    <div key={copy.id} className="p-4 bg-neutral-50 rounded-lg shadow-sm">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-base text-neutral-900 font-semibold">副本 ID: {copy.barcode}</p>
                          {/* <p className="text-sm text-neutral-600">位置: {copy.location}</p> */}
                        </div>
                        {/* <button className="text-sm text-neutral-900 bg-neutral-200 hover:bg-neutral-300 px-3 py-1 rounded-md transition-colors">
                          借阅此副本
                        </button> */}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-600 border-t border-neutral-200 pt-4">当前没有可借副本。</p>
              )}
            </section>
          </>
        )}

        {activeTab === 'reviews' && (
          <section id="reviews-content" className="mb-8">
            {/* 发表评论区域 */}
            <div className="mb-8 p-6 bg-white rounded-lg shadow">
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">撰写评论</h3>
              <form onSubmit={handlePostReview}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">您的评分</label>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setNewReviewRating(star)}
                        className={`text-3xl cursor-pointer transition-colors ${
                          (hoverRating || newReviewRating) >= star
                            ? 'text-yellow-400'
                            : 'text-neutral-300 hover:text-yellow-300'
                        }`}
                        aria-label={`Rate ${star} out of 5 stars`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label htmlFor="reviewText" className="block text-sm font-medium text-neutral-700 mb-2">您的评论</label>
                  <textarea
                    id="reviewText"
                    name="reviewText"
                    rows={4}
                    className="form-textarea mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 placeholder-neutral-400"
                    placeholder="在此写下您的想法..."
                    value={newReviewText}
                    onChange={(e) => setNewReviewText(e.target.value)}
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={!newReviewRating || !newReviewText.trim()}
                  className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  发表评论
                </button>
              </form>
            </div>

            {/* 现有评论列表 */}
            <h2 className="text-neutral-900 text-2xl font-bold leading-tight tracking-tight mb-4">图书评论 ({reviews?.length || 0})</h2>
            
            {/* 评分分布图 - 使用 currentRatingAvg, currentRatingCount, currentRatingDistribution */}
            {currentRatingCount > 0 && currentRatingDistribution.length === 5 && (
              <div className="mb-8 p-6 bg-white rounded-lg shadow">
                <h3 className="text-xl font-semibold text-neutral-900 mb-1">评分概要</h3>
                
                {/* 平均分和总评价 */}
                <div className="flex items-center mb-4">
                  <span className="text-3xl font-bold text-neutral-800 mr-2">
                    {currentRatingAvg?.toFixed(1) ?? 'N/A'}
                  </span>
                  <div className="flex flex-col">
                    <div className="flex">
                      {renderStars(Math.round(currentRatingAvg ?? 0))}
                    </div>
                    <span className="text-sm text-neutral-500">
                      基于 {currentRatingCount} 条评价
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {currentRatingDistribution.slice().reverse().map((count, index) => {
                    const starLevel = 5 - index; // 5, 4, 3, 2, 1
                    const percentage = getPercentage(count);
                    return (
                      <div key={starLevel} className="flex items-center gap-3">
                        <span className="text-sm text-neutral-600 w-12 text-right">{starLevel} 星</span>
                        <div className="flex-1 bg-neutral-200 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-yellow-400 h-2.5 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-neutral-600 w-16 text-left">{percentage}% ({count})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {reviews && reviews.length > 0 ? (
              <div className="space-y-6 border-t border-neutral-200 pt-6">
                {reviews.map((review: BookReview) => {
                  // 格式化时间为 yyyy-M-d - HH:mm:ss
                  const dateObj = new Date(review.commentDate);
                  const pad = (n: number) => n < 10 ? `0${n}` : n;
                  const formattedDate = `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate()} - ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`;
                  return (
                    <div key={review.id} className="flex items-start gap-4 p-4 bg-neutral-50 rounded-lg shadow-sm">
                      {/* 头像 */}
                      {review.userAvatar ? (
                        <Image src={review.userAvatar} alt={review.userName || 'User avatar'} width={40} height={40} className="rounded-full flex-shrink-0" />
                      ) : (
                        <div className="flex items-center justify-center w-10 h-10 bg-neutral-200 rounded-full text-neutral-500 font-semibold flex-shrink-0">
                          {(review.userName || 'U').substring(0, 1)}
                        </div>
                      )}
                      {/* 用户名+时间+内容 */}
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-base text-neutral-900 font-semibold mr-2">{review.userName}</h4>
                          <span className="text-sm text-neutral-500">{formattedDate}</span>
                        </div>
                        <div className="flex items-center mb-2">
                          {renderStars(review.rating)}
                        </div>
                        <p className="text-neutral-700 text-base leading-relaxed">
                          {review.commentText}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {hasMoreReviews && (
                  <div className="text-center mt-6">
                    <button
                      onClick={fetchMoreReviews}
                      disabled={isLoadingMoreReviews}
                      className="inline-flex items-center justify-center rounded-md bg-neutral-100 px-5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingMoreReviews ? '加载中...' : '加载更多评论'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-neutral-600 border-t border-neutral-200 pt-4">暂无评论，快来写第一条吧！</p>
            )}
          </section>
        )}

        {activeTab === 'similar-books' && (
          <section id="similar-books-content" className="mb-8">
            <h2 className="text-neutral-900 text-2xl font-bold leading-tight tracking-tight mb-4">相关推荐 ({recommendations?.length || 0})</h2>
            {recommendations && recommendations.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 border-t border-neutral-200 pt-4">
                  {recommendations.map((rec: BookSearchResult) => (
                    <Link key={rec.id} href={`/book-detail/${rec.id}`} className="group block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                      <div className="relative w-full aspect-[2/3]">
                        <Image
                          src={rec.cover}
                          alt={rec.title || 'Book cover'}
                          layout="fill"
                          objectFit="cover"
                          className="group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="text-md font-semibold text-neutral-900 truncate group-hover:text-indigo-600 transition-colors">{rec.title}</h3>
                        <p className="text-sm text-neutral-600 truncate">{rec.author}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                {hasMoreRecommendations && (
                  <div className="text-center mt-8">
                    <button
                      onClick={fetchMoreRecommendations}
                      disabled={isLoadingMoreRecommendations}
                      className="inline-flex items-center justify-center rounded-md bg-neutral-100 px-5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingMoreRecommendations ? '加载中...' : '加载更多推荐'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-neutral-600 border-t border-neutral-200 pt-4">暂无相关推荐。</p>
            )}
          </section>
        )}
      </div>
    </>
  );
}
