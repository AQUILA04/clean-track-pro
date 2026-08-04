'use client';



import React, { useEffect, useState } from 'react';

import { UsersTable } from '@/components/users/UsersTable';

import { UserFilters, UserRoleFilter, UserStatusFilter } from '@/components/users/UserFilters';

import { InviteUserModal } from '@/components/users/InviteUserModal';

import { EditUserModal } from '@/components/users/EditUserModal';

import { Button } from '@/components/ui/Button';

import { SuccessModal } from '@/components/ui/SuccessModal';

import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

import { UserService, User } from '@/services/user.service';

import { TenantService, Tenant } from '@/services/tenant.service';

import { Plus, ChevronDown } from 'lucide-react';

import { useSession } from 'next-auth/react';

import { hasAnyRole, getRoleDisplayLabel, getSessionRoles } from '@/lib/roles';

import { useToast } from '@/components/ui/simple-toast';



const USE_MOCK_DATA = false;



const isPendingAccountSetup = (user: User) => user.requiredActions?.includes('UPDATE_PASSWORD') ?? false;



function exportUsersToCsv(users: User[]) {

    const headers = ['Nom', 'Email', 'Rôle', 'Statut', 'Agences'];

    const rows = users.map((user) => {

        const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username;

        const status = isPendingAccountSetup(user) ? 'Invitation en attente' : 'Compte configuré';

        const agencies = (user.agencies ?? []).map((agency) => agency.name).join('; ');

        return [fullName, user.email, getRoleDisplayLabel(user.role ?? 'User_Site'), status, agencies];

    });



    const csvContent = [headers, ...rows]

        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))

        .join('\n');



    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;

    link.download = `utilisateurs-${new Date().toISOString().slice(0, 10)}.csv`;

    link.click();

    URL.revokeObjectURL(url);

}



export default function UsersPage() {

    const { data: session } = useSession();

    const { showToast } = useToast();

    const userRoles = getSessionRoles(session?.user);

    const isSuperadmin = hasAnyRole(userRoles, ['Superadmin', 'Super_Admin']);



    const [users, setUsers] = useState<User[]>([]);

    const [tenants, setTenants] = useState<Tenant[]>([]);

    const [selectedTenantId, setSelectedTenantId] = useState('');

    const [isLoading, setIsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');

    const [roleFilter, setRoleFilter] = useState<UserRoleFilter>('all');

    const [statusFilter, setStatusFilter] = useState<UserStatusFilter>('all');

    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

    const [editingUser, setEditingUser] = useState<User | null>(null);

    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    const [isDeleting, setIsDeleting] = useState(false);

    const [resendingInvitationUserId, setResendingInvitationUserId] = useState<string | null>(null);



    useEffect(() => {

        if (!isSuperadmin) return;

        TenantService.getAll()

            .then((data) => {

                setTenants(data);

                if (data.length > 0 && !selectedTenantId) {

                    setSelectedTenantId(data[0].id);

                }

            })

            .catch((error) => console.error('Failed to fetch tenants:', error));

        // eslint-disable-next-line react-hooks/exhaustive-deps -- only load tenants once for Superadmin

    }, [isSuperadmin]);



    const fetchUsers = async () => {

        setIsLoading(true);

        try {

            if (USE_MOCK_DATA && !isSuperadmin) {

                setUsers(await UserService.getMockUsers());

            } else if (isSuperadmin) {

                if (!selectedTenantId) {

                    setUsers([]);

                } else {

                    setUsers(await UserService.getUsers({ tenantId: selectedTenantId }));

                }

            } else {

                setUsers(await UserService.getUsers());

            }

        } catch (error) {

            console.error('Failed to fetch users:', error);

            showToast('Impossible de charger les utilisateurs', 'error');

        } finally {

            setIsLoading(false);

        }

    };



    useEffect(() => {

        fetchUsers();

        // eslint-disable-next-line react-hooks/exhaustive-deps

    }, [isSuperadmin, selectedTenantId]);



    const handleSearch = (query: string) => {

        setSearchQuery(query);

    };



    const handleInviteSuccess = () => {

        setIsInviteModalOpen(false);

        setIsSuccessModalOpen(true);

        fetchUsers();

    };



    const filteredUsers = users.filter((user) => {

        const query = searchQuery.toLowerCase();

        const firstName = user.firstName ?? '';

        const lastName = user.lastName ?? '';

        const agencies = user.agencies ?? [];

        const matchesSearch =

            firstName.toLowerCase().includes(query) ||

            lastName.toLowerCase().includes(query) ||

            user.email.toLowerCase().includes(query) ||

            agencies.some((a) => a.name.toLowerCase().includes(query));



        const matchesRole = roleFilter === 'all' || user.role === roleFilter;

        const pendingSetup = isPendingAccountSetup(user);

        const matchesStatus =

            statusFilter === 'all' ||

            (statusFilter === 'pending' && pendingSetup) ||

            (statusFilter === 'active' && !pendingSetup);



        return matchesSearch && matchesRole && matchesStatus;

    });



    const handleEdit = (user: User) => {

        setEditingUser(user);

    };



    const handleEditSuccess = () => {

        showToast('Utilisateur mis à jour avec succès', 'success');

        fetchUsers();

    };



    const handleDeleteConfirm = async () => {

        if (!deletingUser) return;



        setIsDeleting(true);

        try {

            await UserService.deleteUser(

                deletingUser.id,

                isSuperadmin ? { tenantId: selectedTenantId } : undefined,

            );

            showToast('Utilisateur retiré avec succès', 'success');

            setDeletingUser(null);

            fetchUsers();

        } catch (error: unknown) {

            const message = error instanceof Error ? error.message : 'Impossible de retirer l\'utilisateur';

            showToast(message, 'error');

        } finally {

            setIsDeleting(false);

        }

    };



    const handleResendInvitation = async (user: User) => {

        setResendingInvitationUserId(user.id);

        try {

            await UserService.resendInvitation(user.id, isSuperadmin ? { tenantId: selectedTenantId } : undefined);

            showToast(`Invitation renvoyée à ${user.email}`, 'success');

        } catch (error: unknown) {

            const message = error instanceof Error ? error.message : "Échec du renvoi de l'invitation";

            showToast(message, 'error');

        } finally {

            setResendingInvitationUserId(null);

        }

    };



    const handleExport = () => {

        if (filteredUsers.length === 0) {

            showToast('Aucun utilisateur à exporter', 'error');

            return;

        }

        exportUsersToCsv(filteredUsers);

        showToast(`${filteredUsers.length} utilisateur(s) exporté(s)`, 'success');

    };



    const deletingUserName =

        deletingUser

            ? `${deletingUser.firstName ?? ''} ${deletingUser.lastName ?? ''}`.trim() || deletingUser.email

            : '';



    return (

        <div className="space-y-6">

            <div className="flex items-center justify-between gap-4 flex-wrap">

                <div>

                    <h1 className="text-2xl font-bold text-foreground">

                        {isSuperadmin ? 'Utilisateurs Tenant' : 'Gestion des Utilisateurs'}

                    </h1>

                    <p className="text-muted-foreground mt-1">

                        {isSuperadmin

                            ? 'Invitez et gérez les administrateurs pour chaque pressing.'

                            : 'Gérez les accès et les permissions de votre réseau de blanchisserie.'}

                    </p>

                </div>

                <Button

                    icon={<Plus className="h-4 w-4" />}

                    onClick={() => setIsInviteModalOpen(true)}

                    disabled={isSuperadmin && !selectedTenantId && tenants.length === 0}

                >

                    {isSuperadmin ? 'Inviter un administrateur' : 'Inviter un utilisateur'}

                </Button>

            </div>



            {isSuperadmin && (

                <div className="max-w-sm">

                    <label className="block text-sm font-medium text-foreground mb-1.5">Tenant</label>

                    <div className="relative">

                        <select

                            className="w-full appearance-none rounded-lg border border-border bg-card py-2.5 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"

                            value={selectedTenantId}

                            onChange={(e) => setSelectedTenantId(e.target.value)}

                        >

                            {tenants.length === 0 && <option value="">Aucun tenant</option>}

                            {tenants.map((tenant) => (

                                <option key={tenant.id} value={tenant.id}>

                                    {tenant.name}

                                </option>

                            ))}

                        </select>

                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">

                            <ChevronDown className="h-4 w-4" />

                        </div>

                    </div>

                </div>

            )}



            <div className="bg-card rounded-xl border border-border p-6">

                <UserFilters

                    searchQuery={searchQuery}

                    onSearchChange={handleSearch}

                    roleFilter={roleFilter}

                    statusFilter={statusFilter}

                    onRoleFilterChange={setRoleFilter}

                    onStatusFilterChange={setStatusFilter}

                    onExportClick={handleExport}

                    isSuperadmin={isSuperadmin}

                />



                {isLoading ? (

                    <div className="flex justify-center py-12">

                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>

                    </div>

                ) : (

                    <UsersTable

                        users={filteredUsers}

                        onEdit={handleEdit}

                        onDelete={setDeletingUser}

                        onResendInvitation={handleResendInvitation}

                        isResendingInvitation={Boolean(resendingInvitationUserId)}

                        resendingUserId={resendingInvitationUserId}

                    />

                )}



                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">

                    <div>

                        Affichage de {filteredUsers.length} utilisateur

                        {filteredUsers.length !== 1 ? 's' : ''}

                    </div>

                </div>

            </div>



            <InviteUserModal

                isOpen={isInviteModalOpen}

                onClose={() => setIsInviteModalOpen(false)}

                onSuccess={handleInviteSuccess}

                defaultTenantId={selectedTenantId}

            />



            <EditUserModal

                isOpen={Boolean(editingUser)}

                user={editingUser}

                onClose={() => setEditingUser(null)}

                onSuccess={handleEditSuccess}

                isSuperadmin={isSuperadmin}

                tenantId={selectedTenantId}

            />



            <ConfirmationModal

                isOpen={Boolean(deletingUser)}

                onClose={() => !isDeleting && setDeletingUser(null)}

                onConfirm={handleDeleteConfirm}

                title="Retirer l'utilisateur ?"

                message={`L'accès de « ${deletingUserName} » sera révoqué définitivement. Cette action est irréversible.`}

                confirmLabel={isDeleting ? 'Suppression...' : 'Retirer'}

                cancelLabel="Annuler"

                variant="danger"

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

