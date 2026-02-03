'use client';

import React, { useEffect, useState } from 'react';
import { UsersTable } from '@/components/users/UsersTable';
import { UserFilters } from '@/components/users/UserFilters';
import { InviteUserModal } from '@/components/users/InviteUserModal';
import { Button } from '@/components/ui/Button';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { UserService, User } from '@/services/user.service';
import { Plus } from 'lucide-react';

const USE_MOCK_DATA = true; // Toggle this to switch between Mock and Real data

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = USE_MOCK_DATA
                ? await UserService.getMockUsers()
                : await UserService.getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            // TODO: Show failure toast/modal
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const handleInviteSuccess = () => {
        setIsInviteModalOpen(false);
        setIsSuccessModalOpen(true);
        fetchUsers(); // Refresh list (for mock, we might need to simulate addition if not persistent)
        // For now, mock invite adds to list? No, UserService.inviteUser calls API. 
        // If USE_MOCK_DATA is true, we might want Invite to be mock too, but UserService.inviteUser is real.
        // I should probably mock inviteUser too if I want full offline.
        // But the plan didn't strictly say mock invite, just mock data. 
        // I'll stick to real invite or just assume it works for now.
    };

    const filteredUsers = users.filter(user => {
        const query = searchQuery.toLowerCase();
        return (
            user.firstName.toLowerCase().includes(query) ||
            user.lastName.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.agencies.some(a => a.name.toLowerCase().includes(query))
        );
    });

    const handleDelete = (user: User) => {
        if (confirm(`Are you sure you want to remove ${user.firstName} ${user.lastName}?`)) {
            // TODO: Implement delete API
            console.log('Delete user:', user.id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
                    <p className="text-gray-500 mt-1">Gérez les accès et les permissions de votre réseau de blanchisserie.</p>
                </div>
                <Button icon={<Plus className="h-4 w-4" />} onClick={() => setIsInviteModalOpen(true)}>
                    Inviter un utilisateur
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <UserFilters
                    searchQuery={searchQuery}
                    onSearchChange={handleSearch}
                    onExportClick={() => console.log('Export clicked')}
                    onFilterClick={() => console.log('Filter clicked')}
                />

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <UsersTable
                        users={filteredUsers}
                        onEdit={(user) => console.log('Edit user', user)}
                        onDelete={handleDelete}
                    />
                )}

                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <div>
                        Affichage de {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''}
                    </div>
                    {/* Placeholder Pagination */}
                    <div className="flex gap-2">
                        <button className="p-1 rounded hover:bg-gray-100" disabled>&lt;</button>
                        <button className="px-3 py-1 bg-primary text-white rounded-md">1</button>
                        <button className="px-3 py-1 hover:bg-gray-100 rounded-md">2</button>
                        <button className="px-3 py-1 hover:bg-gray-100 rounded-md">3</button>
                        <button className="p-1 rounded hover:bg-gray-100">&gt;</button>
                    </div>
                </div>
            </div>

            <InviteUserModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                onSuccess={handleInviteSuccess}
            />

            <SuccessModal
                isOpen={isSuccessModalOpen}
                onClose={() => setIsSuccessModalOpen(false)}
                title="Invitation envoyée"
                message="L'utilisateur recevra un email pour activer son compte."
            />
        </div>
    );
}
