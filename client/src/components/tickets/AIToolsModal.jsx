import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { summarizeTicket, suggestReply } from '@/services/aiService';
import { toast } from 'react-hot-toast';
import { Sparkles, MessageSquare, AlertCircle } from 'lucide-react';

const AIToolsModal = ({ isOpen, onClose, ticket }) => {
    const [loadingAction, setLoadingAction] = useState(null); // 'summarize' | 'suggest' | null
    const [result, setResult] = useState(null); // { type: 'summary' | 'suggestion', content: string }
    const [error, setError] = useState(null);

    const handleAction = async (actionType) => {
        if (!ticket) return;

        setLoadingAction(actionType);
        setResult(null);
        setError(null);

        try {
            let content = null;
            // Use empty string fallback if description is missing (ticket list doesn't include it)
            const ticketTitle = ticket.title || '';
            const ticketDescription = ticket.description || '';

            if (actionType === 'summarize') {
                content = await summarizeTicket(ticketTitle, ticketDescription);
            } else if (actionType === 'suggest') {
                content = await suggestReply(ticketTitle, ticketDescription);
            }

            if (content) {
                setResult({ type: actionType, content });
            } else {
                setError('AI is temporarily unavailable');
            }
        } catch (err) {
            setError('AI is temporarily unavailable');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleClose = () => {
        setResult(null);
        setError(null);
        setLoadingAction(null);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="w-5 h-5" />
                    <span>AI Tools</span>
                </div>
            }
            maxWidth="max-w-xl"
        >
            <div className="space-y-6">
                {/* Ticket Context */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Selected Ticket</p>
                    <p className="font-medium text-slate-900 dark:text-white truncate">{ticket?.title}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">#{ticket?.ticketId}</p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => handleAction('summarize')}
                        disabled={!!loadingAction}
                        className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 hover:border-indigo-100 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 dark:hover:border-indigo-900/30 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full mb-3 group-hover:scale-110 transition-transform">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">Summarize Ticket</span>
                        <span className="text-xs text-slate-500 mt-1">Get a concise overview</span>
                    </button>

                    <button
                        onClick={() => handleAction('suggest')}
                        disabled={!!loadingAction}
                        className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 hover:border-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 dark:hover:border-emerald-900/30 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full mb-3 group-hover:scale-110 transition-transform">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">Suggest Reply</span>
                        <span className="text-xs text-slate-500 mt-1">Draft a response</span>
                    </button>
                </div>

                {/* Loading State */}
                {loadingAction && (
                    <div className="flex items-center justify-center py-8">
                        <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
                            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 animate-pulse">
                                {loadingAction === 'summarize' ? 'Summarizing ticket...' : 'Generating suggestion...'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg flex items-start gap-3 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                {/* Result Display */}
                {result && !loadingAction && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-bold uppercase tracking-wider ${result.type === 'summarize' ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'
                                }`}>
                                {result.type === 'summarize' ? 'Ticket Summary' : 'Suggested Reply'}
                            </span>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-slate-400 h-6 text-xs"
                                onClick={() => {
                                    navigator.clipboard.writeText(result.content);
                                    toast.success('Copied to clipboard');
                                }}
                            >
                                Copy
                            </Button>
                        </div>
                        <textarea
                            readOnly
                            className="w-full h-40 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm leading-relaxed text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                            value={result.content}
                        />
                    </div>
                )}

                <div className="flex justify-end pt-2">
                    <Button variant="outline" onClick={handleClose}>
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AIToolsModal;
