const rateLimit = require('express-rate-limit');

// General API rate limiter
// 100 requests per 15 minutes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        message: 'Too many requests, please try again later.'
    }
});

// Stricter limiter for auth routes (login/register)
// 5 attempts per 15 minutes to prevent brute force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        message: 'Too many login attempts, please try again after 15 minutes.'
    }
});

// File upload limiter
// 20 uploads per hour
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        message: 'Upload limit exceeded, please try again later.'
    }
});

module.exports = {
    apiLimiter,
    authLimiter,
    uploadLimiter
};
