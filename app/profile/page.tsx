'use client';

import React, { useState } from 'react';
import UserProfileSection from './UserProfileSection';
import BorrowingHistorySection from './BorrowingHistorySection';
import FavoritesSection from './FavoritesSection';
import Header from '@/components/layout/Header'; // 导入 Header 组件
import useAuthStore from '@/store/authStore'; // 导入 authStore 以获取用户信息
import Image from 'next/image'; // 导入 Image 组件
import OverdueRecordsSection from './OverdueRecordsSection'; // 导入新增组件
import AddBookSection from './AddBookSection'; // 导入新增组件
import AddAdminSection from './AddAdminSection'; // 导入新增组件

type Tab = 'profile' | 'history' | 'favorites' | 'overdue' | 'addBook' | 'addAdmin';

// 为侧边栏项目定义接口，以包含图标
interface SidebarItem {
  id: Tab;
  label: string;
  icon: string; // Material Icons 名称
  adminOnly?: boolean; // 新增属性，标记是否为管理员专属
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const { user, isAuthenticated } = useAuthStore(); // 从 store 获取用户认证状态和信息

  const sidebarItems: SidebarItem[] = [
    { id: 'profile', label: '个人信息', icon: 'info' },
    { id: 'history', label: '借阅历史', icon: 'menu_book' },
    { id: 'favorites', label: '我的收藏', icon: 'favorite' },
    { id: 'overdue', label: '逾期记录查询', icon: 'warning', adminOnly: true },
    { id: 'addBook', label: '添加图书', icon: 'add_circle', adminOnly: true },
    { id: 'addAdmin', label: '添加管理员', icon: 'person_add', adminOnly: true },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <UserProfileSection />;
      case 'history':
        return <BorrowingHistorySection />;
      case 'favorites':
        return <FavoritesSection />;
      case 'overdue': // 新增 case
        return <OverdueRecordsSection />;
      case 'addBook': // 新增 case
        return <AddBookSection />;
      case 'addAdmin': // 新增 case
        return <AddAdminSection />;
      default:
        return <UserProfileSection />;
    }
  };

  const filteredSidebarItems = sidebarItems.filter(item => {
    if (item.adminOnly) {
      return isAuthenticated && user?.role === 'ROLE_ADMIN';
    }
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50"> {/* 主背景色 */}
      <Header />
      <div className="flex flex-1">
        {/* 侧边栏 */}
        <aside className="w-64 bg-white p-5 shadow-md"> {/* 调整宽度和内边距 */}
          {isAuthenticated && user && (
            <div className="mb-8 pt-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 mx-auto mb-3">
                <Image
                  src={user.avatar || '/avatar.png'} // 假设 authStore.user 中有 avatar 字段
                  alt={`${user.username || '用户'}的头像`}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    // 类型断言，因为 Next/Image 的 onError 的 target 可能不是 HTMLImageElement
                    const target = e.target as HTMLImageElement;
                    target.srcset = '/avatar.png';
                    target.src = '/avatar.png';
                  }}
                />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 text-center truncate">{user.username || '用户名'}</h2>
            </div>
          )}
          <nav>
            <ul>
              {filteredSidebarItems.map((item) => (
                <li key={item.id} className="mb-1.5"> {/* 调整间距 */}
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center py-2.5 px-4 rounded-md text-left text-sm font-medium transition-colors duration-150
                      ${activeTab === item.id
                        ? 'bg-slate-800 text-white shadow-sm' // 激活状态样式
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' // 非激活状态样式
                      }`}
                  >
                    <span className="material-icons mr-3 text-lg">{item.icon}</span>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* 主内容区域 */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
