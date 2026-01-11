import React from 'react';
import { Bell, Menu, Search } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import UserMenu from './UserMenu';
import NotificationDropdown from './NotificationDropdown';
import SearchInput from '../common/SearchInput';

const Header = () => {
  const { user } = useAuthStore();
  const { toggleSidebar } = useUIStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-600 focus:outline-none lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="hidden md:block w-72 lg:w-96">
          <SearchInput placeholder="Quick search tickets..." size="sm" />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <NotificationDropdown />
        
        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1"></div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
              {user?.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
              {user?.role}
            </p>
          </div>
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
