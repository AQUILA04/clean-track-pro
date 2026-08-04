import React, { forwardRef } from 'react';
import { Search } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    labelClassName?: string;
    error?: string;
    icon?: React.ReactNode;
    variant?: 'standard' | 'omnibox';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    labelClassName,
    error,
    icon,
    variant = 'standard',
    className = '',
    ...props
}, ref) => {

    // Standard Input Styles
    const standardStyles = "w-full pl-4 pr-4 py-3 bg-card border border-border rounded-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all";

    // Omnibox Styles (Search)
    const omniboxStyles = "w-full pl-12 pr-5 py-4 bg-secondary border-2 border-primary rounded-md text-lg font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0";

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
                <label className={`block text-sm font-medium mb-1.5 ${labelClassName || 'text-foreground'}`}>
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
