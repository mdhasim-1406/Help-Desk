import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Send,
  Paperclip,
  User,
  Settings,
  MoreVertical,
  Shield,
  MessageSquare,
  Clock,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useTicketStore } from '@/store/ticketStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';
import Button from '@/components/common/Button';
import TicketStatusBadge from '@/components/tickets/TicketStatusBadge';
import TicketPriorityBadge from '@/components/tickets/TicketPriorityBadge';
import Select from '@/components/common/Select';
import { cn } from '@/utils/cn';

const AgentTicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    ticket,
    messages,
    isLoading,
    fetchTicketById,
    fetchTicketMessages,
    addMessage,
    updateTicketStatus,
    updateTicketPriority
  } = useTicketStore();

  const [activeTab, setActiveTab] = useState('reply'); // 'reply' or 'note'
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchTicketById(id);
    fetchTicketMessages(id);
  }, [id, fetchTicketById, fetchTicketMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const isInternal = activeTab === 'note';
      await addMessage(id, { content, isInternal });
      setContent('');
      toast.success(isInternal ? 'Internal note added' : 'Reply sent');
    } catch (error) {
      toast.error(error.message || 'Error sending message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateTicketStatus(id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      await updateTicketPriority(id, newPriority);
      toast.success(`Priority updated to ${newPriority}`);
    } catch (error) {
      toast.error('Failed to update priority');
    }
  };

  const getCustomerName = (customer) => {
    if (!customer) return 'Unknown';
    if (customer.name) return customer.name;
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown';
  };

  if (isLoading && !ticket) {
    return <div className="p-12 text-center animate-pulse">Loading ticket...</div>;
  }

  if (!ticket) return <div className="p-12 text-center">Ticket not found</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft} />
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-mono font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-1.5 py-0.5 rounded">
                  #{ticket.id.substring(0, 8)}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-medium text-slate-500">
                  Customer: {getCustomerName(ticket.customer)}
                </span>
              </div>
              <h1 className="text-lg font-bold truncate max-w-md">{ticket.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <Select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                options={[
                  { value: 'open', label: 'Open' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'resolved', label: 'Resolved' },
                  { value: 'closed', label: 'Closed' }
                ]}
                className="w-32 h-9 text-xs"
              />
              <Select
                value={ticket.priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'urgent', label: 'Urgent' }
                ]}
                className="w-32 h-9 text-xs"
              />
            </div>
            <Button variant="ghost" size="sm" icon={MoreVertical} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Feed */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Initial Request */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600">
                    {getCustomerName(ticket.customer)?.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{getCustomerName(ticket.customer)}</h4>
                    <p className="text-[11px] text-slate-400">{format(new Date(ticket.createdAt), 'PPpp')}</p>
                  </div>
                </div>
                <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Original Request
                </div>
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </div>
            </div>

            {/* Response Thread */}
            {messages.map(msg => (
              <div
                key={msg.id}
                className={cn(
                  "relative pl-12 group",
                  msg.isInternal ? "internal-note" : "public-reply"
                )}
              >
                <div className={cn(
                  "absolute left-4 top-0 bottom-0 w-0.5",
                  msg.isInternal ? "bg-amber-200 dark:bg-amber-900" : "bg-primary-200 dark:bg-primary-900"
                )} />

                <div className={cn(
                  "absolute left-2.5 top-0 h-4 w-4 rounded-full flex items-center justify-center z-10",
                  msg.isInternal ? "bg-amber-500 text-white" : "bg-blue-500 text-white"
                )}>
                  {msg.isInternal ? <Shield size={10} /> : <MessageSquare size={10} />}
                </div>

                <div className={cn(
                  "p-4 rounded-xl border shadow-sm",
                  msg.isInternal
                    ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30"
                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">{msg.user?.name}</span>
                      {msg.isInternal && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded uppercase">
                          Internal Note
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">{format(new Date(msg.createdAt), 'p')}</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Box */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-1 mb-2 px-1">
                <button
                  onClick={() => setActiveTab('reply')}
                  className={cn(
                    "px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-b-2",
                    activeTab === 'reply'
                      ? "text-primary-600 border-primary-600 bg-primary-50/50 dark:bg-primary-900/10"
                      : "text-slate-400 border-transparent hover:text-slate-600"
                  )}
                >
                  Public Reply
                </button>
                <button
                  onClick={() => setActiveTab('note')}
                  className={cn(
                    "px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-b-2",
                    activeTab === 'note'
                      ? "text-amber-600 border-amber-600 bg-amber-50/50 dark:bg-amber-900/10"
                      : "text-slate-400 border-transparent hover:text-slate-600"
                  )}
                >
                  Internal Note
                </button>
              </div>

              <div className={cn(
                "rounded-xl border p-3 focus-within:ring-2",
                activeTab === 'note'
                  ? "border-amber-200 bg-amber-50/20 focus-within:ring-amber-500"
                  : "border-slate-200 bg-slate-50/50 focus-within:ring-primary-500"
              )}>
                <textarea
                  className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 min-h-[100px] resize-none"
                  placeholder={activeTab === 'note' ? "Visible only to agents..." : "Type your message to the customer..."}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" icon={Paperclip} className="text-slate-400" />
                  </div>
                  <Button
                    size="sm"
                    icon={Send}
                    isLoading={isSubmitting}
                    disabled={!content.trim()}
                    className={cn(activeTab === 'note' && "bg-amber-600 hover:bg-amber-700")}
                    onClick={handleSubmit}
                  >
                    {activeTab === 'note' ? 'Add Note' : 'Send Reply'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 hidden xl:flex flex-col">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Customer Info</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-xl font-bold">
                {getCustomerName(ticket.customer)?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{getCustomerName(ticket.customer)}</p>
                <p className="text-xs text-slate-500 truncate">{ticket.customer?.email}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full" icon={ExternalLink}>View Profile</Button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Ticket Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Status</span>
                  <TicketStatusBadge status={ticket.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Priority</span>
                  <TicketPriorityBadge priority={ticket.priority} />
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Category</span>
                  <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">{ticket.category?.name || 'General'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Assigned To</span>
                  <span className="text-xs font-bold">{ticket.assignedTo?.name || 'Unassigned'}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Timeline</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold">Ticket Created</p>
                    <p className="text-[10px] text-slate-400">{format(new Date(ticket.createdAt), 'MMM d, h:mm a')}</p>
                  </div>
                </div>
                {ticket.updatedAt !== ticket.createdAt && (
                  <div className="flex gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold">Last Activity</p>
                      <p className="text-[10px] text-slate-400">{format(new Date(ticket.updatedAt), 'MMM d, h:mm a')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentTicketDetailPage;
