// backend/src/routes/api/ai.js
// Isolated AI routes for ticket summarization and reply suggestions
// Read-only, failure-safe, no side effects

const express = require('express');
const { authMiddleware } = require('../../middleware/auth');

const router = express.Router();

// Groq API configuration
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';
const GROQ_TIMEOUT_MS = 8000;

/**
 * Call Groq API with timeout and error handling
 * Returns null on any failure (missing key, timeout, API error)
 */
async function callGroqAPI(systemPrompt, userContent) {
    const apiKey = process.env.GROQ_API_KEY;

    // Graceful degradation: no API key = null response
    if (!apiKey) {
        console.warn('[AI] GROQ_API_KEY not configured, returning null');
        return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userContent }
                ],
                temperature: 0.3,
                max_tokens: 400
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error('[AI] Groq API error:', response.status, await response.text());
            return null;
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() || null;

    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error('[AI] Groq API timeout after', GROQ_TIMEOUT_MS, 'ms');
        } else {
            console.error('[AI] Groq API call failed:', error.message);
        }
        return null;
    }
}

/**
 * POST /api/ai/summarize-ticket
 * Generate a concise 3-bullet summary of a ticket
 * Input: { title: string, description: string }
 * Output: { success: true, summary: string | null }
 */
router.post('/summarize-ticket', authMiddleware, async (req, res) => {
    try {
        const { title, description } = req.body;

        // Validate input
        if (!title || typeof title !== 'string' || !description || typeof description !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Both title and description are required',
                code: 'VALIDATION_ERROR'
            });
        }

        const systemPrompt = `You are a professional helpdesk assistant. Summarize the following support ticket in exactly 3 concise bullet points.
Rules:
- Be factual and professional
- Do NOT make assumptions beyond what is stated
- Do NOT add information that isn't in the ticket
- Each bullet should be one clear sentence
- Focus on: the issue, any relevant context provided, and what the customer needs`;

        const userContent = `Ticket Title: ${title}\n\nTicket Description: ${description}`;

        const summary = await callGroqAPI(systemPrompt, userContent);

        return res.json({
            success: true,
            summary
        });

    } catch (error) {
        console.error('[AI] summarize-ticket error:', error);
        return res.json({
            success: true,
            summary: null
        });
    }
});

/**
 * POST /api/ai/suggest-reply
 * Generate a professional, empathetic reply suggestion
 * Input: { title: string, description: string }
 * Output: { success: true, suggestion: string | null }
 */
router.post('/suggest-reply', authMiddleware, async (req, res) => {
    try {
        const { title, description } = req.body;

        // Validate input
        if (!title || typeof title !== 'string' || !description || typeof description !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Both title and description are required',
                code: 'VALIDATION_ERROR'
            });
        }

        const systemPrompt = `You are a professional helpdesk agent drafting a reply to a customer support ticket.
Rules:
- Be professional, empathetic, and helpful
- Acknowledge the customer's issue
- Do NOT promise specific fixes or timelines
- Do NOT claim actions have already been taken
- Do NOT make up solutions without context
- Ask clarifying questions if the issue is unclear
- Keep the tone warm but professional
- Output plain text only, no markdown formatting
- Keep response concise (3-5 sentences)`;

        const userContent = `Ticket Title: ${title}\n\nTicket Description: ${description}`;

        const suggestion = await callGroqAPI(systemPrompt, userContent);

        return res.json({
            success: true,
            suggestion
        });

    } catch (error) {
        console.error('[AI] suggest-reply error:', error);
        return res.json({
            success: true,
            suggestion: null
        });
    }
});

module.exports = router;
