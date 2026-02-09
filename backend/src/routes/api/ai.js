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
 * Extract ticket data from request body
 * Supports both nested { ticket: { title, description } } and flat { title, description }
 */
function extractTicketData(body) {
    // Prefer nested format (new contract)
    if (body.ticket && typeof body.ticket === 'object') {
        return {
            title: body.ticket.title,
            description: body.ticket.description
        };
    }
    // Fall back to flat format (legacy)
    return {
        title: body.title,
        description: body.description
    };
}

/**
 * Call Groq API with timeout and error handling
 * Returns { success: true, content } or { success: false, error, statusCode }
 */
async function callGroqAPI(systemPrompt, userContent) {
    const apiKey = process.env.GROQ_API_KEY;

    // Missing API key = service unavailable
    if (!apiKey) {
        console.warn('[AI] GROQ_API_KEY not configured');
        return { success: false, error: 'AI service not configured', statusCode: 503 };
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
            const errorText = await response.text();
            console.error('[AI] Groq API error:', response.status, errorText);
            return { success: false, error: 'AI service temporarily unavailable', statusCode: 502 };
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim() || null;

        if (!content) {
            console.warn('[AI] Groq returned empty response');
            return { success: false, error: 'AI returned empty response', statusCode: 502 };
        }

        return { success: true, content };

    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error('[AI] Groq API timeout after', GROQ_TIMEOUT_MS, 'ms');
            return { success: false, error: 'AI service timeout', statusCode: 504 };
        }
        console.error('[AI] Groq API call failed:', error.message);
        return { success: false, error: 'AI service error', statusCode: 502 };
    }
}

/**
 * POST /api/ai/summarize-ticket
 * Generate a concise 3-bullet summary of a ticket
 * Input: { ticket: { title, description } } or { title, description }
 * Output: { success: true, summary } or { success: false, message, code }
 */
router.post('/summarize-ticket', authMiddleware, async (req, res) => {
    try {
        const { title, description } = extractTicketData(req.body);

        // Validate input with descriptive messages
        if (!title || typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Ticket title is required and must be a non-empty string',
                code: 'VALIDATION_ERROR'
            });
        }

        // Description is optional - use title as fallback if missing
        const ticketDescription = (description && typeof description === 'string' && description.trim() !== '')
            ? description.trim()
            : title.trim();

        const systemPrompt = `You are a professional helpdesk assistant. Summarize the following support ticket in exactly 3 concise bullet points.
Rules:
- Be factual and professional
- Do NOT make assumptions beyond what is stated
- Do NOT add information that isn't in the ticket
- Each bullet should be one clear sentence
- Focus on: the issue, any relevant context provided, and what the customer needs`;

        const userContent = `Ticket Title: ${title.trim()}\n\nTicket Description: ${ticketDescription}`;

        const result = await callGroqAPI(systemPrompt, userContent);

        if (!result.success) {
            return res.status(result.statusCode).json({
                success: false,
                message: result.error,
                code: 'AI_SERVICE_ERROR'
            });
        }

        return res.json({
            success: true,
            summary: result.content
        });

    } catch (error) {
        console.error('[AI] summarize-ticket internal error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            code: 'INTERNAL_ERROR'
        });
    }
});

/**
 * POST /api/ai/suggest-reply
 * Generate a professional, empathetic reply suggestion
 * Input: { ticket: { title, description } } or { title, description }
 * Output: { success: true, suggestion } or { success: false, message, code }
 */
router.post('/suggest-reply', authMiddleware, async (req, res) => {
    try {
        const { title, description } = extractTicketData(req.body);

        // Validate input with descriptive messages
        if (!title || typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Ticket title is required and must be a non-empty string',
                code: 'VALIDATION_ERROR'
            });
        }

        // Description is optional - use title as fallback if missing
        const ticketDescription = (description && typeof description === 'string' && description.trim() !== '')
            ? description.trim()
            : title.trim();

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

        const userContent = `Ticket Title: ${title.trim()}\n\nTicket Description: ${ticketDescription}`;

        const result = await callGroqAPI(systemPrompt, userContent);

        if (!result.success) {
            return res.status(result.statusCode).json({
                success: false,
                message: result.error,
                code: 'AI_SERVICE_ERROR'
            });
        }

        return res.json({
            success: true,
            suggestion: result.content
        });

    } catch (error) {
        console.error('[AI] suggest-reply internal error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;
