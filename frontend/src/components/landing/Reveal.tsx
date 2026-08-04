'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade';

interface RevealProps {
    children: ReactNode;
    className?: string;
    direction?: RevealDirection;
    delay?: number;
    once?: boolean;
}

const hiddenClasses: Record<RevealDirection, string> = {
    up: 'opacity-0 translate-y-10',
    down: 'opacity-0 -translate-y-10',
    left: 'opacity-0 translate-x-10',
    right: 'opacity-0 -translate-x-10',
    scale: 'opacity-0 scale-90',
    fade: 'opacity-0',
};

export function Reveal({
    children,
    className = '',
    direction = 'up',
    delay = 0,
    once = true,
}: RevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    if (once) observer.disconnect();
                } else if (!once) {
                    setVisible(false);
                }
            },
            { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [once]);

    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={`transition-all duration-700 ease-out will-change-transform ${
                visible ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : hiddenClasses[direction]
            } ${className}`}
        >
            {children}
        </div>
    );
}
