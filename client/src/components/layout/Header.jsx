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
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-white/50 dark:border-white/5 bg-background/60 backdrop-blur-xl px-8 transition-all duration-300">
      <div className="flex items-center gap-6 flex-1">
        <button
          onClick={toggleSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/50 dark:bg-white/5 text-muted-foreground hover:bg-white hover:text-foreground hover:shadow-sm focus:outline-none lg:hidden transition-all duration-300 border border-transparent hover:border-border/50"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden md:block w-96 group focus-within:w-[450px] transition-all duration-500">
          <SearchInput placeholder="Search everything..." className="bg-white/50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-black/20 focus:border-primary/20 focus:shadow-lg focus:shadow-primary/5 transition-all duration-300 rounded-xl h-10 px-4" />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <NotificationDropdown />
        </div>

        <div className="h-8 w-[1px] bg-gradient-to-b from-transparent via-border to-transparent mx-2"></div>

        <div className="flex items-center gap-4 pl-2">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-foreground tracking-tight">
              {user?.name}
            </p>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
              {user?.role}
            </p>
          </div>
          <div className="ring-2 ring-white/50 dark:ring-white/5 rounded-full p-0.5 shadow-sm">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
