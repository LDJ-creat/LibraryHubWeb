import Link from 'next/link';
import React from 'react';

const Header = () => {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-neutral-200 px-10 py-4 shadow-sm">
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-3 text-slate-900">
          {/* <span className="material-icons text-3xl text-slate-800">auto_stories</span> */}
          <h1 className="text-2xl font-bold leading-tight tracking-[-0.015em]">LibraryHub</h1>
        </div>
        <nav className="flex items-center gap-8">
          <Link className="text-slate-700 hover:text-slate-900 text-base font-medium leading-normal transition-colors" href="/">主页</Link>
          <Link className="text-slate-700 hover:text-slate-900 text-base font-medium leading-normal transition-colors" href="/categories">分类</Link>
          <Link className="text-slate-700 hover:text-slate-900 text-base font-medium leading-normal transition-colors" href="/rankings">排行榜</Link>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/search" passHref>
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-slate-800 transition-colors pointer-events-none">search</span>
            <input 
              className="form-input h-10 w-64 rounded-full border-neutral-300 bg-neutral-100 pl-10 pr-4 text-slate-900 placeholder:text-neutral-500 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors cursor-pointer" 
              placeholder="Search books..." 
              type="search" 
              readOnly // Make input readOnly as click navigates
            />
        </Link>
        <button aria-label="Notifications" className="flex items-center justify-center rounded-full h-10 w-10 bg-neutral-100 hover:bg-neutral-200 text-slate-700 hover:text-slate-900 transition-colors">
          <span className="material-icons text-2xl">notifications</span>
        </button>
        <Link href="/profile" passHref>
        <button aria-label="User Profile">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-slate-800 transition-colors pointer-events-none">account_circle</span>
          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-neutral-200 hover:border-slate-400 transition-colors" style={{backgroundImage: 'url("/avatar.png")'}}></div>
        </button>
        </Link>
      </div>
    </header>
  );
};

export default Header;
