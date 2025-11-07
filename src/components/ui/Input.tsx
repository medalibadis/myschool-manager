import React, { useEffect, useCallback } from 'react';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className = '', type, onWheel, onKeyDown, ...props }, ref) => {
        const isNumber = type === 'number';
        const inputRef = React.useRef<HTMLInputElement>(null);
        const wheelHandlerRef = React.useRef<((e: WheelEvent) => void) | null>(null);

        // Callback ref to set up wheel prevention immediately when element is mounted
        const setInputRef = useCallback((element: HTMLInputElement | null) => {
            // Clean up previous listener if exists
            if (inputRef.current && wheelHandlerRef.current) {
                const prevElement = inputRef.current;
                const prevHandler = wheelHandlerRef.current;
                prevElement.removeEventListener('wheel', prevHandler, true);
                prevElement.removeEventListener('mousewheel', prevHandler as any, true);
                prevElement.removeEventListener('DOMMouseScroll', prevHandler as any, true);
            }

            inputRef.current = element;

            // Set up new listener if this is a number input
            if (isNumber && element) {
                const wheelHandler = (e: WheelEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    // Blur to prevent any further interactions
                    if (document.activeElement === element) {
                        element.blur();
                    }
                    return false;
                };
                
                // CRITICAL FIX: Add multiple event listeners for cross-platform compatibility
                // Windows browsers may handle wheel events differently
                wheelHandlerRef.current = wheelHandler;
                
                // Add wheel event (standard)
                element.addEventListener('wheel', wheelHandler, { passive: false, capture: true });
                
                // Add mousewheel event (legacy support for older browsers/Windows)
                element.addEventListener('mousewheel', wheelHandler as any, { passive: false, capture: true });
                
                // Add DOMMouseScroll event (Firefox legacy)
                element.addEventListener('DOMMouseScroll', wheelHandler as any, { passive: false, capture: true });
            } else {
                wheelHandlerRef.current = null;
            }

            // Forward ref to parent if provided
            if (typeof ref === 'function') {
                ref(element);
            } else if (ref) {
                (ref as React.MutableRefObject<HTMLInputElement | null>).current = element;
            }
        }, [isNumber, ref]);

        // Cleanup on unmount
        useEffect(() => {
            return () => {
                if (inputRef.current && wheelHandlerRef.current) {
                    const element = inputRef.current;
                    const handler = wheelHandlerRef.current;
                    element.removeEventListener('wheel', handler, true);
                    element.removeEventListener('mousewheel', handler as any, true);
                    element.removeEventListener('DOMMouseScroll', handler as any, true);
                }
            };
        }, []);

        const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
            if (isNumber && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                // Prevent arrow key increments/decrements
                e.preventDefault();
                e.stopPropagation();
            }
            if (onKeyDown) onKeyDown(e);
        };

        const handleWheel: React.WheelEventHandler<HTMLInputElement> = (e) => {
            if (isNumber) {
                // Additional prevention (backup)
                e.preventDefault();
                e.stopPropagation();
            }
            if (onWheel) onWheel(e);
        };

        return (
            <input
                type={type}
                className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 placeholder:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
                ref={setInputRef}
                onKeyDown={isNumber ? handleKeyDown : onKeyDown}
                onWheel={isNumber ? handleWheel : onWheel}
                {...props}
            />
        );
    }
);
Input.displayName = 'Input';

export { Input }; 