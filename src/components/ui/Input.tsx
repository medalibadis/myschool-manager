import React from 'react';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className = '', type, onWheel, onKeyDown, ...props }, ref) => {
        const isNumber = type === 'number';

        const handleWheel: React.WheelEventHandler<HTMLInputElement> = (e) => {
            if (isNumber) {
                // Prevent scroll wheel from incrementing/decrementing number inputs
                e.preventDefault();
                // Blurring avoids value changes on some browsers when wheel is used
                (e.currentTarget as HTMLInputElement).blur();
            }
            if (onWheel) onWheel(e);
        };

        const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
            if (isNumber && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                // Prevent arrow key increments/decrements
                e.preventDefault();
            }
            if (onKeyDown) onKeyDown(e);
        };

        return (
            <input
                type={type}
                className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 placeholder:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
                ref={ref}
                onWheel={handleWheel}
                onKeyDown={handleKeyDown}
                {...props}
            />
        );
    }
);
Input.displayName = 'Input';

export { Input }; 