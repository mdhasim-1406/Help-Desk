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
import { getUsers } from '@/services/userService';
import { summarizeTicket, suggestReply } from '@/services/aiService';
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
    updateTicketPriority,
    assignTicket
  } = useTicketStore();

  const [activeTab, setActiveTab] = useState('reply'); // 'reply' or 'note'
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agents, setAgents] = useState([]);
  const messagesEndRef = useRef(null);

  // AI feature state
  const [aiSummary, setAiSummary] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
    fetchTicketById(id);
    fetchTicketMessages(id);
    fetchTicketById(id);
    fetchTicketMessages(id);
  }, [id, fetchTicketById, fetchTicketMessages]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await getUsers({ role: 'AGENT' });
        setAgents(response.data || response.users || []);
      } catch (error) {
        console.error('Failed to fetch agents', error);
      }
    };

    const userRole = typeof user.role === 'string' ? user.role : user.role?.name;
    if (user && ['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      fetchAgents();
    }
  }, [user]);

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

  const handleAssign = async (agentId) => {
    try {
      await assignTicket(id, agentId);
      toast.success('Ticket assigned successfully');
    } catch (error) {
      toast.error('Failed to assign ticket');
    }
  };

  // AI feature handlers
  const handleSummarize = async () => {
    if (!ticket) return;
    setIsSummarizing(true);
    setAiSummary(null);
    try {
      const summary = await summarizeTicket(ticket.title, ticket.description);
      if (summary) {
        setAiSummary(summary);
      } else {
        toast.error('AI unavailable');
      }
    } catch {
      toast.error('AI unavailable');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSuggestReply = async () => {
    if (!ticket) return;
    setIsSuggesting(true);
    setAiSuggestion(null);
    try {
      const suggestion = await suggestReply(ticket.title, ticket.description);
      if (suggestion) {
        setAiSuggestion(suggestion);
        setContent(suggestion); // Pre-fill reply box
        toast.success('Reply suggestion added to editor');
      } else {
        toast.error('AI unavailable');
      }
    } catch {
      toast.error('AI unavailable');
    } finally {
      setIsSuggesting(false);
    }
  };

  const getCustomerName = (customer) => {
    if (!customer) return 'Unknown';
    if (customer.name) return customer.name;
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown';
  };

  const getSenderName = (user) => {
    if (!user) return 'Unknown';
    if (user.name) return user.name;
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
  };

  const getSenderRole = (user) => {
    if (!user || !user.role) return '';
    return user.role === 'CUSTOMER' ? 'Customer' : user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
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
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold">
                          {getSenderName(msg.user)}
                        </span>
                        {msg.user?.role && msg.user.role !== 'CUSTOMER' && (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {getSenderRole(msg.user)}
                          </span>
                        )}
                      </div>
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
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Assigned To</span>
                  {(['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(typeof user.role === 'string' ? user.role : user.role?.name)) ? (
                    <select
                      className="text-xs font-bold bg-transparent border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 focus:outline-none focus:border-primary-500 dark:bg-slate-900"
                      value={ticket.assignedTo?.id || ''}
                      onChange={(e) => handleAssign(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {agents.map(agent => (
                        <option key={agent.id} value={agent.id}>
                          {agent.firstName} {agent.lastName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs font-bold">{ticket.assignedTo?.name || 'Unassigned'}</span>
                  )}
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

            {/* AI Tools Section */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">AI Assistant</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                >
                  {isSummarizing ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin h-3 w-3 border-2 border-primary-500 border-t-transparent rounded-full" />
                      Summarizing...
                    </span>
                  ) : (
                    '✨ Summarize Ticket'
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleSuggestReply}
                  disabled={isSuggesting}
                >
                  {isSuggesting ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin h-3 w-3 border-2 border-primary-500 border-t-transparent rounded-full" />
                      Generating...
                    </span>
                  ) : (
                    '✨ Suggest Reply'
                  )}
                </Button>
              </div>

              {/* AI Summary Result */}
              {aiSummary && (
                <div className="mt-3 p-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg">
                  <p className="text-[10px] font-bold uppercase text-violet-600 dark:text-violet-400 mb-1">AI Summary</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{aiSummary}</p>
                </div>
              )}

              {/* AI Suggestion Result */}
              {aiSuggestion && (
                <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <p className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-1">Suggested Reply</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{aiSuggestion}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentTicketDetailPage;
