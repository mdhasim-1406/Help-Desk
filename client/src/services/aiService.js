// client/src/services/aiService.js
// AI service for ticket summarization and reply suggestions
// Graceful failure handling - never throws, returns null on error

import api from './api';

/**
 * Summarize a ticket using AI
 * @param {string} title - Ticket title
 * @param {string} description - Ticket description
 * @returns {Promise<string|null>} Summary or null on failure
 */
export async function summarizeTicket(title, description) {
    try {
        const response = await api.post('/ai/summarize-ticket', { title, description });
        return response.data?.summary || null;
    } catch (error) {
        console.error('[AI] summarizeTicket failed:', error.message);
        return null;
    }
}

/**
 * Get AI-suggested reply for a ticket
 * @param {string} title - Ticket title
 * @param {string} description - Ticket description
 * @returns {Promise<string|null>} Suggestion or null on failure
 */
export async function suggestReply(title, description) {
    try {
        const response = await api.post('/ai/suggest-reply', { title, description });
        return response.data?.suggestion || null;
    } catch (error) {
        console.error('[AI] suggestReply failed:', error.message);
        return null;
    }
}
