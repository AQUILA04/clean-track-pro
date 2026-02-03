import React, { forwardRef } from 'react';
import { Search } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    variant?: 'standard' | 'omnibox';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    icon,
    variant = 'standard',
    className = '',
    ...props
}, ref) => {

    // Standard Input Styles
    const standardStyles = "w-full pl-4 pr-4 py-3 bg-white border border-gray-300 rounded-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all";

    // Omnibox Styles (Search)
    const omniboxStyles = "w-full pl-12 pr-5 py-4 bg-secondary border-2 border-primary rounded-md text-lg font-medium text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0";

    const errorStyles = "border-error focus:border-error focus:ring-error/10";

    const inputClasses = `
        ${variant === 'omnibox' ? omniboxStyles : standardStyles}
        ${error ? errorStyles : ''}
        ${icon && variant === 'standard' ? 'pl-10' : ''}
        ${className}
    `;

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                {/* Omnibox Icon (Fixed Search) */}
                {variant === 'omnibox' && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                        <Search className="h-6 w-6" />
                    </div>
                )}

                {/* Standard Icon */}
                {variant === 'standard' && icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {icon}
                    </div>
                )}

                <input
                    ref={ref}
                    className={inputClasses}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-sm text-error">{error}</p>
            )}
        </div>
    );
});

Input.displayName = "Input";
