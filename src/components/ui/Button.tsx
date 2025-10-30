import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
    {
        variants: {
            variant: {
                default: 'bg-orange-500 text-white hover:bg-orange-600',
                destructive: 'bg-red-500 text-white hover:bg-red-600',
                outline: 'border border-orange-500 text-orange-500 hover:bg-orange-50',
                secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
                ghost: 'hover:bg-gray-100 text-gray-900',
                link: 'text-orange-500 underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-10 py-2 px-4',
                sm: 'h-9 px-3 rounded-md',
                lg: 'h-11 px-8 rounded-md',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    /**
     * If provided, the button will show disabled state while this async handler is running
     * and prevent subsequent clicks until it resolves/rejects.
     */
    onClickAsync?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => Promise<unknown>;
    /** External loading state to force-disable the button */
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, onClick, onClickAsync, disabled, isLoading, ...props }, ref) => {
        const [internalLoading, setInternalLoading] = React.useState(false);

        const handleClick = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            // If an explicit async handler is provided, run it with a lock
            if (onClickAsync) {
                if (internalLoading) return;
                try {
                    setInternalLoading(true);
                    await onClickAsync(event);
                } finally {
                    setInternalLoading(false);
                }
                return;
            }

            // Fallback: if regular onClick returns a Promise, lock until it settles
            if (onClick) {
                const result = onClick(event);
                // Detect promise-like return and lock
                if (result && typeof (result as unknown as Promise<unknown>).then === 'function') {
                    if (internalLoading) return;
                    try {
                        setInternalLoading(true);
                        await (result as unknown as Promise<unknown>);
                    } finally {
                        setInternalLoading(false);
                    }
                }
            }
        };

        const isDisabled = disabled || isLoading || internalLoading;

        return (
            <button
                className={buttonVariants({ variant, size, className })}
                ref={ref}
                disabled={isDisabled}
                onClick={handleClick}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';

export { Button, buttonVariants }; 