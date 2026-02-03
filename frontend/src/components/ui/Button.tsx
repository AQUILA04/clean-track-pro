import React from 'react';
import { Loader2, Zap } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'express' | 'destructive' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'default',
    isLoading = false,
    icon,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center rounded-md font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const sizes = {
        default: "px-6 py-3.5",
        sm: "px-3 py-2 text-xs",
        lg: "px-8 py-4 text-base",
        icon: "h-10 w-10 p-0"
    };

    const variants = {
        primary: "bg-primary text-white hover:bg-primary-dark focus:ring-primary",
        secondary: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-gray-200",
        express: "bg-accent text-white hover:bg-[#E65F00] focus:ring-accent",
        destructive: "bg-transparent border border-error text-error hover:bg-error/10 hover:border-error focus:ring-error",
        ghost: "bg-transparent text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500"
    };

    return (
        <button
            className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className={`animate-spin ${size === 'icon' ? 'h-5 w-5' : 'mr-2 h-4 w-4'}`} />}
            {!isLoading && variant === 'express' && <Zap className="mr-2 h-4 w-4 fill-white" />}
            {!isLoading && icon && size !== 'icon' && <span className="mr-2">{icon}</span>}
            {!isLoading && size === 'icon' ? (icon || children) : children}
        </button>
    );
};
