import Link from 'next/link';
import Image from 'next/image';
import { Recommendation, Announcement } from '@/types/home';
import { get } from '@/lib/apiClient'; // Import the get function
import { cookies } from 'next/headers'; // Import cookies


async function getRecommendations(): Promise<Recommendation[]> {
  try {
    // Fetch cookies from the request context
    // This is necessary to forward cookies to the API
    const cookieStore = await cookies();
    const forwardedCookies = cookieStore.getAll().map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`).join('; ');
    console.log('Forwarding cookies to /books/recommendations/ in page.tsx:', forwardedCookies);
    const response = await get<Recommendation[]>('/books/recommendations/', undefined, forwardedCookies);
    console.log('Response from /books/recommendations/:', response);
    return response || [];
  } catch (error) {
    console.error('Failed to fetch recommendations:', error);
    return []; 
  }
}

async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const cookieStore = await cookies();
    const forwardedCookies = cookieStore.getAll().map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`).join('; ');
    console.log('Forwarding cookies to /books/recommendations/ in page.tsx:', forwardedCookies);
    const response = await get<Announcement[]>('/articles/', undefined, forwardedCookies);
    return response || [];
  } catch (error) {
    console.error('Failed to fetch announcements:', error);
    return []; 
  }
}

export default async function HomePage() {
  const [recommendations, announcements] = await Promise.all([
    getRecommendations(),
    getAnnouncements()
  ]);

  return (
    <div className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-neutral-200 px-10 py-4 shadow-sm">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3 text-slate-900">
              {/* <span className="material-icons text-3xl text-slate-800">auto_stories</span> */}
              <h1 className="text-2xl font-bold leading-tight tracking-[-0.015em]">LibraryHub</h1>
            </div>
            <nav className="flex items-center gap-8">
              <Link className="text-slate-700 hover:text-slate-900 text-base font-medium leading-normal transition-colors" href="/categories">分类</Link>
              <Link className="text-slate-700 hover:text-slate-900 text-base font-medium leading-normal transition-colors" href="/rankings">排行榜</Link>
              <Link className="text-slate-700 hover:text-slate-900 text-base font-medium leading-normal transition-colors" href="/ai-assistant">AI助手</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-slate-800 transition-colors">search</span>
              <input className="form-input h-10 w-64 rounded-full border-neutral-300 bg-neutral-100 pl-10 pr-4 text-slate-900 placeholder:text-neutral-500 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors" placeholder="Search books..." type="search"/>
            </div>
            <button aria-label="Notifications" className="flex items-center justify-center rounded-full h-10 w-10 bg-neutral-100 hover:bg-neutral-200 text-slate-700 hover:text-slate-900 transition-colors">
              <span className="material-icons text-2xl">notifications</span>
            </button>
            <button aria-label="User Profile">
              <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-neutral-200 hover:border-slate-400 transition-colors" style={{backgroundImage: 'url("/avatar.png")'}}></div>
            </button>
          </div>
        </header>
        <main className="flex flex-1 justify-center py-10 px-4 sm:px-8 md:px-16 lg:px-24">
          <div className="layout-content-container flex w-full max-w-screen-xl flex-col gap-8">
            <section>
              <h2 className="text-slate-900 text-3xl font-bold leading-tight tracking-tight px-4 pb-6 pt-2">每日推荐</h2>
              {recommendations.length > 0 ? (
                <div className="p-4 @container">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="flex flex-col items-stretch @container justify-start rounded-xl shadow-lg overflow-hidden bg-white @[600px]:flex-row @[600px]:items-start transition-shadow hover:shadow-xl mb-6">
                      <div className="relative w-full max-w-52 mx-auto @[600px]:w-[180px] @[600px]:max-w-none @[600px]:mx-0 @[600px]:shrink-0 flex items-center justify-center bg-gray-100 aspect-[2/3] overflow-hidden rounded-t-xl @[600px]:rounded-t-none @[600px]:rounded-l-xl @[600px]:rounded-r-xl border-b @[600px]:border-b-0 border-gray-200">
                        <Image
                          src={rec.cover}
                          alt={rec.title}
                          layout="fill"
                          objectFit="cover"
                        />
                      </div>
                      <div className="flex w-full @[600px]:flex-1 grow flex-col items-stretch justify-center gap-2 p-6 @[600px]:p-8 rounded-b-xl @[600px]:rounded-b-none @[600px]:rounded-l-none @[600px]:rounded-r-xl">
                        <h3 className="text-slate-900 text-2xl font-bold leading-tight tracking-tight">{rec.title}</h3>
                        <p className="text-neutral-600 text-lg font-normal leading-relaxed">
                          {rec.description}
                        </p>
                        <p className="text-neutral-500 text-base font-medium leading-normal pt-2">By {rec.author}</p>
                        <Link href={`/book/${rec.bookId ?? rec.id}`} className="mt-4 self-start rounded-full bg-slate-800 px-6 py-3 text-base font-semibold text-white hover:bg-slate-700 transition-colors focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-slate-800">
                          了解更多
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-4 text-neutral-500">暂无每日推荐。</p>
              )}
            </section>

            <section>
              <h2 className="text-slate-900 text-3xl font-bold leading-tight tracking-tight px-4 pb-6 pt-2">Popular Events &amp; Announcements</h2>
              {announcements.length > 0 ? (
                <div className="relative">
                  <div className="flex overflow-x-auto pb-6 [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="flex items-stretch px-4 gap-6">
                      {announcements.map((ann) => (
                        <div key={ann.id} className="flex h-full w-80 flex-col gap-4 rounded-xl shadow-lg overflow-hidden bg-white transition-shadow hover:shadow-xl">
                          <div className="w-full bg-center bg-no-repeat aspect-[16/10] bg-cover" style={{backgroundImage: `url("${ann.coverImage || '/announcement.png'}")`}}></div>
                          <div className="p-5 flex flex-col flex-grow">
                            <h3 className="text-slate-900 text-lg font-semibold leading-snug">{ann.title}</h3>
                            <p className="text-sm text-gray-600">
                              {ann.updatedTime}
                            </p>
                            <Link className="text-sm font-semibold text-slate-700 hover:text-slate-900 self-start mt-2" href={`/announcement/${ann.id}`}>查看详情 →</Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="px-4 text-neutral-500">暂无热门活动与公告。</p>
              )}
            </section>
          </div>
        </main>
        <footer className="border-t border-neutral-200 bg-neutral-100 py-8 text-center text-sm text-neutral-600">
          <p>© {new Date().getFullYear()} LibraryHub. All rights reserved. Crafted with <span className="material-icons text-sm align-middle text-red-500">favorite</span> by Book Lovers.</p>
        </footer>
      </div>
    </div>
  );
}


