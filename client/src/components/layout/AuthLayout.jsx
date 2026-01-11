import React from 'react';
import { Outlet } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 shadow-lg shadow-primary-500/20 mb-4">
            <LifeBuoy className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">HelpDesk Pro</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest text-[10px] font-bold">
            Customer Support Reimagined
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none p-8 border border-slate-100 dark:border-slate-800">
          <Outlet />
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} HelpDesk Pro. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
