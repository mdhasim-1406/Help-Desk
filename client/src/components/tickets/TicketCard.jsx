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
      noPadding
      className={cn(
        "group hover:border-primary/30 transition-all duration-300 hover:shadow-medium cursor-pointer relative overflow-hidden",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="p-5 flex flex-col gap-4 relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0 flex-1">
            <Link
              to={getTicketPath()}
              className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 tracking-tight"
            >
              {title}
            </Link>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
              <span className="font-mono text-primary/70">#{ticketId}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>{category}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <TicketStatusBadge status={status} />
            <TicketPriorityBadge priority={priority} />
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-4 text-xs text-muted-foreground font-medium">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 hover:text-foreground transition-colors" title="Comments">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{commentCount}</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-foreground transition-colors" title="Attachments">
              <Paperclip className="w-3.5 h-3.5" />
              <span>{attachmentCount}</span>
            </div>
            {onAIAction && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAIAction(ticket);
                }}
                className="flex items-center gap-1.5 text-indigo-500 hover:text-indigo-600 transition-colors ml-2"
                title="Use AI Tools"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AI Tools</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDistanceToNow(new Date(createdAt))} ago</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TicketCard;
