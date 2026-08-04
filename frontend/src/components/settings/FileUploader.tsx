'use client';

import React, { useRef } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';

interface FileUploaderProps {
    title: string;
    icon?: React.ElementType;
    label: string;
    sublabel: string;
    accept?: string;
    aspectRatio?: 'landscape' | 'square';
    value?: string | null;
    uploading?: boolean;
    onChange?: (file: File) => void;
    onClear?: () => void;
    disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
    title,
    icon: Icon,
    label,
    sublabel,
    accept = 'image/png,image/jpeg,image/svg+xml,image/webp',
    aspectRatio = 'landscape',
    value,
    uploading = false,
    onChange,
    onClear,
    disabled = false,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File | undefined) => {
        if (!file || disabled || uploading) return;
        onChange?.(file);
    };

    return (
        <div className="flex flex-col">
            <label className="text-sm font-medium text-foreground mb-2">{title}</label>
            <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={accept}
                disabled={disabled || uploading}
                onChange={(e) => {
                    handleFile(e.target.files?.[0]);
                    e.target.value = '';
                }}
            />

            {value ? (
                <div
                    className={`relative w-full rounded-lg overflow-hidden border border-border bg-muted group ${
                        aspectRatio === 'square' ? 'h-48' : 'h-48'
                    }`}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={value}
                        alt={title}
                        className="w-full h-full object-contain p-3"
                    />
                    {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                    )}
                    {!disabled && !uploading && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                className="p-2 bg-card rounded-full border border-border text-foreground hover:bg-primary/10"
                                aria-label="Remplacer"
                            >
                                <Upload className="h-4 w-4" />
                            </button>
                            {onClear && (
                                <button
                                    type="button"
                                    onClick={onClear}
                                    className="p-2 bg-card rounded-full border border-border text-red-400 hover:bg-red-500/10"
                                    aria-label="Supprimer"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <button
                    type="button"
                    disabled={disabled || uploading}
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleFile(e.dataTransfer.files?.[0]);
                    }}
                    className="
                        border-2 border-dashed border-border rounded-lg
                        flex flex-col items-center justify-center
                        text-center hover:bg-muted/50 transition-colors
                        group h-48 w-full disabled:opacity-50 disabled:cursor-not-allowed
                    "
                >
                    {uploading ? (
                        <Loader2 className="h-6 w-6 text-primary animate-spin mb-3" />
                    ) : (
                        <div className="p-3 bg-secondary rounded-full mb-3 group-hover:bg-primary/10 transition-colors">
                            {Icon ? (
                                <Icon className="h-6 w-6 text-primary" />
                            ) : (
                                <ImageIcon className="h-6 w-6 text-primary" />
                            )}
                        </div>
                    )}
                    <span className="text-sm font-semibold text-foreground mb-1">
                        {uploading ? 'Téléversement…' : label}
                    </span>
                    <span className="text-xs text-muted-foreground px-4">{sublabel}</span>
                </button>
            )}
        </div>
    );
};
