import React from 'react';
import { Outlet } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-slate-200/20 dark:bg-grid-slate-800/20 [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="flex flex-col items-center mb-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-600 shadow-lg shadow-primary/25 mb-6 ring-4 ring-background">
            <LifeBuoy className="h-8 w-8 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">HelpDesk Pro</h1>
          <p className="text-muted-foreground mt-2 uppercase tracking-[0.2em] text-[10px] font-bold">
            Customer Support Reimagined
          </p>
        </div>

        <div className="bg-card/80 backdrop-blur-xl rounded-3xl shadow-hard p-8 border border-white/20 dark:border-white/5 ring-1 ring-black/5 dark:ring-white/10">
          <Outlet />
        </div>

        <div className="mt-8 text-center text-xs font-medium text-muted-foreground/60">
          <p>&copy; {new Date().getFullYear()} HelpDesk Pro. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
