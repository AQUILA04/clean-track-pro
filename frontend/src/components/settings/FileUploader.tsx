import React from 'react';
import { Upload, Globe } from 'lucide-react';

interface FileUploaderProps {
    title: string;
    icon?: React.ElementType;
    label: string;
    sublabel: string;
    accept?: string;
    aspectRatio?: 'landscape' | 'square';
}

export const FileUploader: React.FC<FileUploaderProps> = ({
    title,
    icon: Icon,
    label,
    sublabel,
    aspectRatio = 'landscape'
}) => {
    return (
        <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">{title}</label>
            <div className={`
                border-2 border-dashed border-gray-200 rounded-lg 
                flex flex-col items-center justify-center 
                text-center hover:bg-gray-50 transition-colors cursor-pointer
                group
                h-48 w-full
            `}>
                <div className="p-3 bg-secondary rounded-full mb-3 group-hover:bg-blue-100 transition-colors">
                    {Icon ? <Icon className="h-6 w-6 text-primary" /> : <Upload className="h-6 w-6 text-primary" />}
                </div>
                <span className="text-sm font-semibold text-gray-900 mb-1">{label}</span>
                <span className="text-xs text-gray-500">{sublabel}</span>
            </div>
        </div>
    );
};
