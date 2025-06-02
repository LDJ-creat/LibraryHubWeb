import React from 'react';
import Link from 'next/link';
import { Book, BookCopies, BookReview, BookSearchResult } from '@/types/book';
import BookDetailClientContent from './BookDetailClientContent';
import Header from '@/components/layout/Header';
import { get } from '@/lib/apiClient'; // Import the get function
import { cookies } from 'next/headers'; // To forward cookies
import BookCoverImage from './BookCoverImage'; // Import the new client component
import FavoriteButtonClient from './FavoriteButtonClient'; // Import the FavoriteButtonClient component


// Define interfaces for the API response structure
interface ApiBookDetail {
  id: number;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publishedDate: string; // Date string
  category: string;
  description: string;
  cover: string;
  callNumber: string;//索书号
  location: string; //图书位置
  price: number;//价格
  edition: string;// 版本
  pages: number;//页数
  ratingDistribution: number[];
  ratingAvg: number;//平均评分
  ratingCount: number;//评分人数
}

interface ApiCopy {
  id: number;
  barcode: string;
}

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

interface BookDetailDataFromApi {
  book: ApiBookDetail;
  copies: ApiCopy[];
  comments: ApiComment[];
  recommendations: ApiRecommendation[];
}

// Function to fetch book details from the actual API
async function getBookDetails(id: string, forwardedCookies?: string): Promise<Book | null> {
  console.log(`[BookDetailPage] Fetching book details for ID: ${id} from API`);
  try {
    const data = await get<BookDetailDataFromApi>(`/books/search/details?bookId=${id}`, {}, forwardedCookies);

    if (!data || !data.book) {
      console.error('[BookDetailPage] No book data returned from API for ID:', id);
      return null;
    }

    const apiBook = data.book;
    const apiCopies = data.copies || [];
    const apiComments = data.comments || [];
    const apiRecommendations = data.recommendations || [];

    const bookDetail: Book = {
      id: apiBook.id,
      title: apiBook.title,
      author: apiBook.author,
      description: apiBook.description,
      cover: apiBook.cover,
      publisher: apiBook.publisher,
      publishedDate: new Date(apiBook.publishedDate),
      category: apiBook.category,
      isbn: apiBook.isbn,
      callNumber: apiBook.callNumber, // Added callNumber
      location: apiBook.location, // Added location
      price: apiBook.price, // Added price
      edition: apiBook.edition, // Added edition
      pages: apiBook.pages, // Added pages
      ratingDistribution: apiBook.ratingDistribution,
      ratingAvg: apiBook.ratingAvg,
      ratingCount: apiBook.ratingCount,
      bookCopies: apiCopies.map((copy: ApiCopy): BookCopies => ({
        id: copy.id,
        barcode: copy.barcode,
      })),
      reviews: apiComments.map((comment: ApiComment): BookReview => ({
        id: comment.id,
        userAvatar: comment.avatar ? comment.avatar : '/avatar.png', // API has avatar, type has userAvatar
        userName: comment.username, // API has username, type has userName
        rating: comment.rating,
        commentText: comment.content, // API has content, type has commentText
        commentDate: comment.updateTime, // API has updateTime
      })),
      recommendations: apiRecommendations.map((rec: ApiRecommendation): BookSearchResult => ({
        id: rec.id,
        title: rec.title,
        author: rec.author,
        cover: rec.cover,
        // publisher and publishedDate are optional and not in this API response part
      })),
    };
    console.log(`[BookDetailPage] Successfully fetched and mapped book details for ID: ${id}`);
    return bookDetail;
  } catch (error) {
    console.error(`[BookDetailPage] Error fetching book details for ID ${id}:`, error);
    // Depending on the error type, you might want to throw it or return null
    // For now, returning null to show "Book not found"
    return null;
  }
}

export default async function BookDetailPage({ params }: { params: { id: string } }) {
  const bookId = params.id; // No need to await params.id, it's directly available
  
  const cookieStore = await cookies();
  const forwardedCookies = cookieStore.getAll().map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`).join('; ');

  const book = await getBookDetails(bookId, forwardedCookies);

  if (!book) {
    return (
      <div className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden">
        <Header />
        <div className="container mx-auto py-8 text-center">Book not found or error loading details.</div>
      </div>
    );
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden">
      <Header /> 
      <main className="flex-1 bg-neutral-50 py-8">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 px-4 md:px-0">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-1 text-sm text-neutral-500">
                <li><Link className="hover:text-neutral-700 transition-colors" href="/browse">Browse</Link></li>
                <li><span className="text-neutral-400">/</span></li>
                <li><Link className="font-medium text-neutral-900 hover:text-neutral-700 transition-colors" href={`/browse/${book.category?.toLowerCase() || 'general'}`}>{book.category || 'N/A'}</Link></li>
              </ol>
            </nav>
          </div>

          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-shrink-0 md:w-1/4 flex flex-col gap-4 items-center">
                  <BookCoverImage
                    src={book.cover || '/placeholder-cover.png'}
                    alt={book.title}
                    width={200}
                    height={300}
                    className="rounded-lg shadow-md object-cover w-full max-w-[200px]"
                    fallbackSrc="/placeholder-cover.png"
                  />
                  <FavoriteButtonClient bookId={book.id} />
                </div>
                <div className="flex-grow">
                  <div className="mb-4">
                      <h1 className="text-neutral-900 text-3xl md:text-4xl font-bold leading-tight tracking-tight mb-1">{book.title}</h1>
                      <p className="text-neutral-600 text-lg">By {book.author}</p>
                  </div>
                  
                  <BookDetailClientContent book={book} />

                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
