import { get } from '@/lib/apiClient';
import { Announcement } from '@/types/announcement';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { notFound } from 'next/navigation';
import React from 'react'; // Import React
import Header from '@/components/layout/Header'; // Import the Header component

async function getAnnouncementData(id: string): Promise<Announcement | null> {
  try {
    //不要修改此处，该API路径正确
    const data = await get<Announcement>(`/articles/${id}`);
    return data;
  } catch (error: unknown) { 
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error(`Failed to fetch announcement with id ${id}:`, errorMessage);
    return null;
  }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

interface AnnouncementDetailPageProps {
  params: {
    id: string;
  };
}

export default async function AnnouncementDetailPage({ params }: AnnouncementDetailPageProps) {
  const resolvedParams = await params; // Await params as per Next.js warning
  const { id } = resolvedParams;      // Destructure id from the resolved params

  const announcement = await getAnnouncementData(id);

  if (!announcement) {
    notFound(); 
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <Header />
      <div className="py-12 px-4 sm:px-6 lg:px-8"> 
        <article className="max-w-3xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="px-6 py-8 sm:px-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              {announcement?.title}
            </h1>
            <div className="mb-6 text-sm text-neutral-500">
              <p>最后更新于：{formatDate(announcement?.updateTime)}</p>
            </div>
            <div className="prose prose-neutral max-w-none dark:prose-invert">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
              >
                {announcement?.content}
              </ReactMarkdown>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
