import { useEffect } from 'react';

export const useKeyboardShortcuts = (shortcuts: {
    [key: string]: (e: KeyboardEvent) => void;
}) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const isCtrl = e.ctrlKey;
            const isShift = e.shiftKey;
            const isAlt = e.altKey;

            // Create shortcut key
            let shortcutKey = '';
            if (isCtrl) shortcutKey += 'ctrl+';
            if (isShift) shortcutKey += 'shift+';
            if (isAlt) shortcutKey += 'alt+';
            shortcutKey += key;

            const handler = shortcuts[shortcutKey];
            if (handler) {
                e.preventDefault();
                handler(e);
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [shortcuts]);
}; 