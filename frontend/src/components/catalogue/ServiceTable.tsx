import React from 'react';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/Button';
import { Pencil, Trash2, Droplets, Wind, SprayCan, Scissors } from 'lucide-react';

export interface LaundryService {
    id: string;
    name: string;
    description: string;
    icon: string;
    color?: string;
}

interface ServiceTableProps {
    services: LaundryService[];
    onEdit: (service: LaundryService) => void;
    onDelete: (service: LaundryService) => void;
}

const IconMap: Record<string, React.ReactNode> = {
    'Droplets': <Droplets className="h-5 w-5" />,
    'Wind': <Wind className="h-5 w-5" />,
    'SprayCan': <SprayCan className="h-5 w-5" />,
    'Scissors': <Scissors className="h-5 w-5" />,
};

export const ServiceTable: React.FC<ServiceTableProps> = ({ services, onEdit, onDelete }) => {
    return (
        <Table
            data={services}
            keyExtractor={(service) => service.id}
            columns={[
                {
                    header: 'NOM DU SERVICE',
                    accessor: (service) => (
                        <div className="flex items-center space-x-3">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${service.color || 'bg-gray-100 text-gray-500'}`}>
                                {IconMap[service.icon] || <Droplets className="h-5 w-5" />}
                            </div>
                            <span className="font-semibold text-gray-900">{service.name}</span>
                        </div>
                    ),
                    className: "w-1/3"
                },
                {
                    header: 'DESCRIPTION',
                    accessor: (service) => (
                        <span className="text-gray-600 text-sm">{service.description}</span>
                    ),
                },
                {
                    header: 'ACTIONS',
                    accessor: (service) => (
                        <div className="flex items-center justify-end space-x-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(service)}
                                className="text-gray-400 hover:text-gray-600 p-1 h-8 w-8"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(service)}
                                className="text-gray-400 hover:text-red-600 p-1 h-8 w-8"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ),
                    className: "text-right w-24"
                }
            ]}
        />
    );
};
