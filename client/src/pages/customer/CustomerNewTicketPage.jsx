import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTicketStore } from '@/store/ticketStore';
import { useUIStore } from '@/store/uiStore';
import TicketForm from '@/components/tickets/TicketForm';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/common/Button';

const CustomerNewTicketPage = () => {
  const navigate = useNavigate();
  const { createTicket, isLoading } = useTicketStore();
  const { addToast } = useUIStore();

  const handleSubmit = async (ticketData) => {
    try {
      const result = await createTicket(ticketData);
      if (result) {
        addToast('Ticket submitted successfully!', 'success');
        navigate(`/customer/tickets/${result.id}`);
      }
    } catch (error) {
      addToast(error.message || 'Failed to submit ticket', 'error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          icon={ArrowLeft}
        >
          Back
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Submit New Request</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Fill out the form below and our support team will get back to you as soon as possible.
          </p>
        </div>
        
        <div className="p-6">
          <TicketForm 
            onSubmit={handleSubmit} 
            isLoading={isLoading} 
          />
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Need immediate help?</h3>
        <p className="text-sm text-blue-700 dark:text-blue-400">
          Check out our <a href="/customer/kb" className="font-bold underline">Knowledge Base</a> for quick answers to common questions while you wait for a response.
        </p>
      </div>
    </div>
  );
};

export default CustomerNewTicketPage;
