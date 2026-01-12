const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Sanitize a string to remove any XSS vectors.
 * @param {string} content - The content to sanitize
 * @returns {string} Sanitized content
 */
const sanitize = (content) => {
    if (typeof content !== 'string') return content;
    return DOMPurify.sanitize(content);
};

/**
 * Middleware to sanitize specific fields in the request body.
 * @param {Array<string>} fields - Array of field names to sanitize
 */
const sanitizeMiddleware = (fields = []) => {
    return (req, res, next) => {
        if (req.body) {
            fields.forEach(field => {
                if (req.body[field]) {
                    req.body[field] = sanitize(req.body[field]);
                }
            });
        }
        next();
    };
};

module.exports = {
    sanitize,
    sanitizeMiddleware
};
