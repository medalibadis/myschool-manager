'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface GlobalKeyboardShortcutsProps {
    onAddNew?: () => void;
    isModalOpen?: boolean;
}

export const GlobalKeyboardShortcuts: React.FC<GlobalKeyboardShortcutsProps> = ({
    onAddNew,
    isModalOpen = false
}) => {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only log when Alt+N is actually pressed

            // Alt+N for Add New (both lowercase and uppercase 'n')
            if (e.altKey && (e.key === 'n' || e.key === 'N' || e.keyCode === 78)) {
                console.log('Alt+N detected!', { altKey: e.altKey, key: e.key, keyCode: e.keyCode });

                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                if (isModalOpen) {
                    console.log('Modal is open, not triggering Alt+N');
                    return; // Don't trigger if modal is already open
                }

                if (onAddNew) {
                    console.log('Calling onAddNew function');
                    onAddNew();
                } else {
                    console.log('No onAddNew function, using default behavior');
                    // Default behavior based on current page
                    switch (pathname) {
                        case '/waiting-list':
                            // Navigate to waiting list and trigger add
                            router.push('/waiting-list');
                            break;
                        case '/groups':
                            // Navigate to groups and trigger add
                            router.push('/groups');
                            break;
                        case '/teachers':
                            // Navigate to teachers and trigger add
                            router.push('/teachers');
                            break;
                        default:
                            // Default to waiting list
                            router.push('/waiting-list');
                            break;
                    }
                }
            }
        };

        // Use capture phase to intercept the event before browser handles it
        document.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keydown', handleKeyDown, true);

        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [onAddNew, isModalOpen, router, pathname]);

    return null; // This component doesn't render anything
}; 