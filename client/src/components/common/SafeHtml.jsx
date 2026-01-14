import React from 'react';
import { sanitizeHtml } from '@/utils/sanitize';

/**
 * Component to safely render HTML content
 */
export const SafeHtml = ({ html, className = '', ...props }) => {
    const sanitizedHtml = sanitizeHtml(html);

    return (
        <div
            className={`prose prose-slate dark:prose-invert max-w-none ${className}`}
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            {...props}
        />
    );
};

export default SafeHtml;
