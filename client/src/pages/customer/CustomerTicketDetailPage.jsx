import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Send,
  Paperclip,
  Lock,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Filter
} from 'lucide-react';
import { useTicketStore } from '@/store/ticketStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';
import Button from '@/components/common/Button';
import TicketStatusBadge from '@/components/tickets/TicketStatusBadge';
import TicketPriorityBadge from '@/components/tickets/TicketPriorityBadge';
import { SafeHtml } from '@/utils/sanitize.jsx';
import { cn } from '@/utils/helpers';

const CustomerTicketDetailPage = () => {
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
    updateTicketStatus
  } = useTicketStore();

  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchTicketById(id);
    fetchTicketMessages(id);
  }, [id, fetchTicketById, fetchTicketMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && attachments.length === 0) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', newMessage);
      attachments.forEach(file => formData.append('attachments', file));

      await addMessage(id, formData);
      setNewMessage('');
      setAttachments([]);
      toast.success('Message sent');
    } catch (error) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseTicket = async () => {
    if (window.confirm('Are you sure you want to mark this ticket as resolved?')) {
      try {
        await updateTicketStatus(id, 'resolved');
        toast.success('Ticket marked as resolved');
      } catch (error) {
        toast.error(error.message || 'Failed to update ticket');
      }
    }
  };

  if (isLoading && !ticket) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ticket not found</h2>
        <Button variant="ghost" onClick={() => navigate('/customer/tickets')} className="mt-4">
          Go back to tickets
        </Button>
      </div>
    );
  }

  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

  const getSenderName = (user) => {
    if (!user) return 'Support Agent';
    if (user.name) return user.name;
    if (user.firstName || user.lastName) return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return 'Support Agent';
  };

  const getSenderRole = (user) => {
    if (!user || !user.role) return '';
    return user.role === 'CUSTOMER' ? 'Customer' : user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/customer/tickets')}
            icon={ArrowLeft}
          >
            Back
          </Button>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                #{ticket.id.substring(0, 8)}
              </span>
              <TicketStatusBadge status={ticket.status} />
              <TicketPriorityBadge priority={ticket.priority} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{ticket.title}</h1>
          </div>
        </div>

        {!isClosed && (
          <Button
            variant="outline"
            font="medium"
            className="text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-900/10"
            icon={CheckCircle2}
            onClick={handleCloseTicket}
          >
            Mark as Resolved
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content: Messages */}
        <div className="lg:col-span-2 space-y-4 flex flex-col h-[calc(100vh-250px)]">
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
            {/* Original Description */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-50 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <User size={16} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold block leading-none">You (Customer)</span>
                    <span className="text-xs text-slate-500">{format(new Date(ticket.createdAt), 'MMM d, yyyy · p')}</span>
                  </div>
                </div>
              </div>
              <SafeHtml html={ticket.description} className="text-sm" />
              {ticket.attachments?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Attachments</span>
                  <div className="flex flex-wrap gap-2">
                    {ticket.attachments.map((file, idx) => (
                      <a
                        key={idx}
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Paperclip size={12} /> {file.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Message Thread */}
            {messages.map((msg) => {
              const isMe = msg.userId === user.id;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col gap-1 max-w-[85%]",
                    isMe ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    {!isMe && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {getSenderName(msg.user)}
                        </span>
                        {msg.user?.role && msg.user.role !== 'CUSTOMER' && (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {getSenderRole(msg.user)}
                          </span>
                        )}
                      </div>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {format(new Date(msg.createdAt), 'p')}
                    </span>
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl text-sm shadow-sm",
                    isMe
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none"
                  )}>
                    {msg.content}
                    {msg.attachments?.length > 0 && (
                      <div className={cn(
                        "mt-3 pt-3 flex flex-col gap-2 border-t",
                        isMe ? "border-blue-500" : "border-slate-100 dark:border-slate-700"
                      )}>
                        {msg.attachments.map((file, idx) => (
                          <a
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-lg text-xs font-medium",
                              isMe ? "bg-blue-700 hover:bg-blue-800" : "bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                          >
                            <Paperclip size={12} /> {file.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Area */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mt-auto">
            {isClosed ? (
              <div className="flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-slate-500 dark:text-slate-400 italic text-sm">
                <Lock size={14} className="mr-2" />
                This ticket is closed. You cannot send further replies.
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-4">
                <textarea
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 min-h-[80px] resize-none"
                  placeholder="Type your reply here..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">
                      <Paperclip size={20} />
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => setAttachments([...attachments, ...Array.from(e.target.files)])}
                      />
                    </label>
                    <span className="text-xs font-medium text-slate-500">
                      {attachments.length > 0 && `${attachments.length} files attached`}
                    </span>
                  </div>
                  <Button
                    type="submit"
                    icon={Send}
                    isLoading={isSubmitting}
                    disabled={!newMessage.trim() && attachments.length === 0}
                  >
                    Send Reply
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar: Details */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 px-1">Ticket Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center group">
                <span className="text-xs font-medium text-slate-500 flex items-center gap-2">
                  <Clock size={12} /> Created
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-xs font-medium text-slate-500 flex items-center gap-2">
                  <RotateCcw size={12} /> Last Activity
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  {format(new Date(ticket.updatedAt), 'MMM d, h:mm a')}
                </span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-xs font-medium text-slate-500 flex items-center gap-2">
                  <Filter size={12} /> Category
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-white capitalize">
                  {ticket.category?.name || 'General'}
                </span>
              </div>
              <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
                <span className="text-xs font-medium text-slate-500 block mb-2">Assigned Agent</span>
                {ticket.assignedTo ? (
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                      {ticket.assignedTo.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium">{ticket.assignedTo.name}</span>
                  </div>
                ) : (
                  <span className="text-xs italic text-slate-400">Waiting for assignment...</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-600 to-indigo-700 rounded-xl p-5 text-white shadow-lg">
            <h3 className="font-bold mb-2">Resolution Guarantee</h3>
            <p className="text-xs text-primary-100 leading-relaxed">
              We aim to resolve all high-priority tickets within 4 business hours. If you haven't heard from us, please be patient.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const RotateCcw = ({ size }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>;

export default CustomerTicketDetailPage;
