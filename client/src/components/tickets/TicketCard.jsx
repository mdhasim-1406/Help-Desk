import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Paperclip, Clock, Calendar, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/utils/helpers';
import Card from '../common/Card';
import TicketStatusBadge from './TicketStatusBadge';
import TicketPriorityBadge from './TicketPriorityBadge';
import { useAuthStore } from '@/store/authStore';
import { normalizeToString } from '@/utils/normalize';

const TicketCard = ({ ticket, className, onAIAction }) => {
  const { user } = useAuthStore();
  const {
    id,
    ticketId,
    title,
    status,
    priority,
    category,
    createdAt,
    updatedAt,
    commentCount = 0,
    attachmentCount = 0
  } = ticket;

  // Get role-based ticket detail path
  const getTicketPath = () => {
    const role = normalizeToString(user?.role, 'CUSTOMER').toUpperCase();
    switch (role) {
      case 'ADMIN':
        return `/admin/tickets/${id}`;
      case 'MANAGER':
        return `/manager/tickets/${id}`;
      case 'AGENT':
        return `/agent/tickets/${id}`;
      case 'CUSTOMER':
      default:
        return `/customer/tickets/${id}`;
    }
  };

  return (
    <Card
      className={cn(
        "group hover:border-primary-300 transition-all duration-200",
        className
      )}
    >
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <Link
              to={getTicketPath()}
              className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1"
            >
              {title}
            </Link>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {ticketId} • {category}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <TicketStatusBadge status={status} />
            <TicketPriorityBadge priority={priority} />
            {onAIAction && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAIAction(ticket);
                }}
                className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors mt-1"
                title="AI Tools"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5" title="Comments">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{commentCount}</span>
            </div>
            <div className="flex items-center gap-1.5" title="Attachments">
              <Paperclip className="w-3.5 h-3.5" />
              <span>{attachmentCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>Created {formatDistanceToNow(new Date(createdAt))} ago</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TicketCard;
