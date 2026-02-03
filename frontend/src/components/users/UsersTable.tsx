import React from 'react';
import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pencil, UserMinus } from 'lucide-react';
import { User } from '@/services/user.service';

interface UsersTableProps {
    users: User[];
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
}

const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const getColorClass = (firstName: string) => {
    const colors = [
        'bg-blue-100 text-blue-600',
        'bg-green-100 text-green-600',
        'bg-yellow-100 text-yellow-600',
        'bg-purple-100 text-purple-600',
        'bg-pink-100 text-pink-600',
    ];
    return colors[firstName.length % colors.length];
};

export const UsersTable: React.FC<UsersTableProps> = ({ users, onEdit, onDelete }) => {
    return (
        <Table
            data={users}
            keyExtractor={(user) => user.id}
            columns={[
                {
                    header: 'UTILISATEUR',
                    accessor: (user) => (
                        <div className="flex items-center">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm mr-3 ${getColorClass(user.firstName)}`}>
                                {getInitials(user.firstName, user.lastName)}
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                                <div className="text-gray-500 text-xs">{user.email}</div>
                            </div>
                        </div>
                    ),
                },
                {
                    header: 'RÔLE',
                    accessor: (user) => {
                        const isPrimary = user.role === 'Admin_Site';
                        return (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isPrimary
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white border border-blue-200 text-blue-600'
                                }`}>
                                {user.role}
                            </span>
                        );
                    },
                },
                {
                    header: 'AGENCES ASSIGNÉES',
                    accessor: (user) => (
                        <div className="flex flex-wrap gap-2">
                            {user.agencies.map((agency) => (
                                <span key={agency.id} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                    {agency.name}
                                </span>
                            ))}
                        </div>
                    ),
                },
                {
                    header: 'ACTIONS',
                    accessor: (user) => (
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(user)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(user)}
                                className="text-gray-400 hover:text-red-600"
                            >
                                <UserMinus className="h-4 w-4" />
                            </Button>
                        </div>
                    ),
                    className: "text-right"
                }
            ]}
        />
    );
};
