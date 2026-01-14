import { useEffect, useRef } from 'react';

/**
 * Custom hook for applying fluid/watery GSAP animations to elements.
 * Falls back gracefully if GSAP is not available.
 */
export const useWateryAnimation = (options = {}) => {
    const elementRef = useRef(null);
    const {
        duration = 0.8,
        delay = 0,
        y = 20,
        opacity = 0,
        ease = 'power3.out'
    } = options;

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        // Check if GSAP is available
        if (typeof window !== 'undefined' && window.gsap) {
            window.gsap.fromTo(
                element,
                { y, opacity },
                { y: 0, opacity: 1, duration, delay, ease }
            );
        } else {
            // Fallback: just make visible without animation
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    }, [duration, delay, y, opacity, ease]);

    return elementRef;
};

/**
 * Custom hook for staggered animations on child elements.
 * Useful for nav links, list items, etc.
 */
export const useStaggeredWateryAnimation = (options = {}) => {
    const containerRef = useRef(null);
    const {
        duration = 0.6,
        stagger = 0.08,
        y = 15,
        opacity = 0,
        ease = 'power2.out',
        childSelector = ':scope > *'
    } = options;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const children = container.querySelectorAll(childSelector);
        if (children.length === 0) return;

        // Check if GSAP is available
        if (typeof window !== 'undefined' && window.gsap) {
            window.gsap.fromTo(
                children,
                { y, opacity },
                { y: 0, opacity: 1, duration, stagger, ease }
            );
        } else {
            // Fallback: just make visible without animation
            children.forEach(child => {
                child.style.opacity = '1';
                child.style.transform = 'translateY(0)';
            });
        }
    }, [duration, stagger, y, opacity, ease, childSelector]);

    return containerRef;
};

export default useWateryAnimation;
