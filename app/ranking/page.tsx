import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import { get } from '@/lib/apiClient';

interface RankedBook {
  id: number; 
  title: string;
  author: string;
  publisher?: string;
  publishedDate?: string;
  cover: string; 
}

async function getRankingData(): Promise<RankedBook[]> {
  try {
    // 注意：这里应该使用排行榜的API端点
    const response = await get<RankedBook[]>('/books/search/category?category=文学');
    if (response) {
      return response;
    }
    console.error('Failed to fetch ranking data:');
    return [];
  } catch (err) {
    console.error('Error fetching ranking data in Server Component:', err);
    return [];
  }
}   


export default async function RankingPage() {
const rankedBooks = await getRankingData();    

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-neutral-800 mb-10 text-center tracking-tight">
          热门图书排行榜
        </h1>
        {rankedBooks.length === 0 && (
        <p className="text-center text-neutral-600 py-10 text-lg">
            目前排行榜暂无数据。
          </p>
        )}
        {rankedBooks.length > 0 && (
          <div className="space-y-6 max-w-3xl mx-auto">
            {rankedBooks.map((book, index) => (
              <Link key={book.id} href={`/book-detail/${book.id}`} className="flex items-center bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 group">
                {/* <a className="flex items-center bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 group"> */}
                  <div className="text-3xl sm:text-4xl font-bold text-neutral-700 w-16 sm:w-20 text-center mr-4 sm:mr-6 flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="relative w-20 h-28 sm:w-24 sm:h-36 flex-shrink-0 mr-4 sm:mr-6 rounded-md overflow-hidden shadow-md">
                    <Image
                      src={book.cover || '/announcement.png'} 
                      alt={`封面: ${book.title}`}
                      layout="fill"
                      objectFit="cover"
                      className="group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex-grow">
                    <h2 className="text-lg sm:text-xl font-semibold text-neutral-700 group-hover:neutral-700 transition-colors duration-300 line-clamp-2" title={book.title}>
                      {book.title}
                    </h2>
                    <p className="text-sm sm:text-base text-neutral-600 mt-1 line-clamp-1" title={book.author}>
                      作者: {book.author}
                    </p>
                    {book.publisher && (
                        <p className="text-xs sm:text-sm text-neutral-500 mt-1 line-clamp-1" title={book.publisher}>
                            出版社: {book.publisher}
                        </p>
                    )}
                  </div>
                {/* </a> */}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
