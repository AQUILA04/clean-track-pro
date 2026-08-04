'use client';

import React, { useRef, useState } from 'react';

interface TooltipProps {
    label: string;
    children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ label, children }) => {
    const triggerRef = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const updatePosition = () => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (!rect) return;
        setPosition({
            top: rect.top - 8,
            left: rect.left + rect.width / 2,
        });
    };

    const show = () => {
        updatePosition();
        setVisible(true);
    };

    return (
        <>
            <div
                ref={triggerRef}
                className="inline-flex"
                onMouseEnter={show}
                onMouseLeave={() => setVisible(false)}
                onFocus={show}
                onBlur={() => setVisible(false)}
            >
                {children}
            </div>
            {visible && (
                <span
                    role="tooltip"
                    style={{
                        top: position.top,
                        left: position.left,
                        transform: 'translate(-50%, -100%)',
                    }}
                    className="pointer-events-none fixed z-[100] rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-lg whitespace-nowrap"
                >
                    {label}
                </span>
            )}
        </>
    );
};
