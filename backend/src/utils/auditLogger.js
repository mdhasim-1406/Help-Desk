/**
 * Audit Logger
 * Logs security-relevant events to the console (stdout).
 * In a production environment, this should forward to a logging service 
 * (e.g., CloudWatch, Datadog, ELK).
 */

const logEvent = (event, { userId, ip, resourceId, details, severity = 'INFO' }) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        severity,
        userId: userId || 'anonymous',
        ip: ip || 'unknown',
        resourceId: resourceId || null,
        details: details || {},
    };

    // Ensure passwords or secrets are never logged
    if (logEntry.details?.password) delete logEntry.details.password;
    if (logEntry.details?.token) delete logEntry.details.token;

    console.log(JSON.stringify(logEntry));
};

module.exports = {
    EVENTS: {
        LOGIN_SUCCESS: 'LOGIN_SUCCESS',
        LOGIN_FAILED: 'LOGIN_FAILED',
        LOGOUT: 'LOGOUT',
        PERMISSION_DENIED: 'PERMISSION_DENIED',
        USER_CREATED: 'USER_CREATED',
        TICKET_DELETED: 'TICKET_DELETED',
        SENSITIVE_ACCESS: 'SENSITIVE_ACCESS'
    },
    logEvent
};
