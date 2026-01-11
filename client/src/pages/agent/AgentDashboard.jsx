import React from 'react';
import { 
  Users, 
  Ticket, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { cn } from '@/utils/cn';

const AgentDashboard = ({ stats }) => {
  const statCards = [
    {
      label: 'Main Queue',
      value: stats.total || 0,
      description: 'Your assigned tickets',
      icon: Ticket,
      color: 'bg-blue-500',
    },
    {
      label: 'Open',
      value: stats.open || 0,
      description: 'Awaiting your action',
      icon: Clock,
      color: 'bg-amber-500',
    },
    {
      label: 'Resolved',
      value: stats.resolved || 0,
      description: 'Last 30 days',
      icon: CheckCircle2,
      color: 'bg-emerald-500',
    },
    {
      label: 'Avg Response',
      value: stats.avgResponse || '2.4h',
      description: 'Target: < 4h',
      icon: TrendingUp,
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="p-4 border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden relative">
            <div className={cn(
              "absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10",
              stat.color
            )} />
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-xl text-white",
                stat.color
              )}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold dark:text-white">{stat.value}</h3>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4 border-t border-slate-50 dark:border-slate-800 pt-2">
              {stat.description}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-500" /> 
            High Priority Queue
          </h3>
          <div className="space-y-3">
             {/* This would ideally list high priority tickets */}
             <p className="text-sm text-slate-500 dark:text-slate-400 italic">
               Loading prioritized requests...
             </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
             <Users size={18} className="text-primary-500" />
             Team Support Chat
          </h3>
          <div className="h-40 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
             <Users size={32} className="mb-2 opacity-20" />
             <p className="text-sm">Team channel is currently quiet.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
