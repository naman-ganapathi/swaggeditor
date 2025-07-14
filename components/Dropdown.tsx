import React, { useState, useRef, useEffect, useLayoutEffect, ReactNode } from 'react';
import ReactDOM from 'react-dom';

interface DropdownProps {
    trigger: (ref: React.RefObject<any>, props: { 'aria-haspopup': boolean, 'aria-expanded': boolean, onClick: (e: React.MouseEvent) => void }) => ReactNode;
    children: (close: () => void) => ReactNode;
    align?: 'left' | 'right';
    contentClassName?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ trigger, children, align = 'left', contentClassName = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [style, setStyle] = useState<React.CSSProperties>({});
    const triggerRef = useRef<HTMLButtonElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const handleToggle = () => setIsOpen(prev => !prev);
    const handleClose = () => setIsOpen(false);

    useLayoutEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const newStyle: React.CSSProperties = {
                position: 'absolute',
                top: `${rect.bottom + window.scrollY + 8}px`,
                zIndex: 1000,
            };
            if (align === 'right') {
                newStyle.right = `${window.innerWidth - rect.right - window.scrollX}px`;
            } else {
                newStyle.left = `${rect.left + window.scrollX}px`;
            }
            setStyle(newStyle);
        }
    }, [isOpen, align]);
    
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                triggerRef.current && !triggerRef.current.contains(event.target as Node) &&
                contentRef.current && !contentRef.current.contains(event.target as Node)
            ) {
                handleClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <>
            {trigger(triggerRef, { 'aria-haspopup': true, 'aria-expanded': isOpen, onClick: handleToggle })}
            {isOpen && ReactDOM.createPortal(
                <div
                    ref={contentRef}
                    style={style}
                    className={`bg-white dark:bg-dracula-current rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 py-1 ${contentClassName}`}
                >
                    {children(handleClose)}
                </div>,
                document.body
            )}
        </>
    );
};
