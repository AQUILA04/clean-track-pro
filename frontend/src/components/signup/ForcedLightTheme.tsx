'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

/** Forces light theme for public signup pages regardless of app default (dark). */
export function ForcedLightTheme({ children }: { children: React.ReactNode }) {
    const { theme, setTheme } = useTheme();
    const previousThemeRef = useRef<string | undefined>(undefined);
    const didForceRef = useRef(false);

    // Apply before paint to avoid white-on-white labels (dark tokens on light card).
    useLayoutEffect(() => {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.documentElement.style.colorScheme = 'light';
    }, []);

    useEffect(() => {
        if (!didForceRef.current) {
            previousThemeRef.current = theme;
            didForceRef.current = true;
            setTheme('light');
        }

        return () => {
            document.documentElement.style.colorScheme = '';
            const previous = previousThemeRef.current;
            if (previous && previous !== 'light') {
                setTheme(previous);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setTheme]);

    return <div className="light" data-theme="light">{children}</div>;
}
