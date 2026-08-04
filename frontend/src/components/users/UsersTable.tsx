import React from 'react';

import { Table } from '@/components/ui/table';

import { Button } from '@/components/ui/Button';

import { Tooltip } from '@/components/ui/Tooltip';

import { Mail, Pencil, UserMinus } from 'lucide-react';

import { User } from '@/services/user.service';
import { getRoleDisplayLabel } from '@/lib/roles';



interface UsersTableProps {

    users: User[];

    onEdit: (user: User) => void;

    onDelete: (user: User) => void;

    onResendInvitation: (user: User) => void;

    isResendingInvitation?: boolean;

    resendingUserId?: string | null;

}



const getInitials = (firstName?: string, lastName?: string) => {

    const f = firstName?.charAt(0) ?? '';

    const l = lastName?.charAt(0) ?? '';

    return `${f}${l}`.toUpperCase() || 'U';

};



const getColorClass = (firstName?: string) => {

    const colors = [

        'bg-blue-500/15 text-blue-300',

        'bg-emerald-500/15 text-emerald-300',

        'bg-amber-500/15 text-amber-300',

        'bg-purple-500/15 text-purple-300',

        'bg-pink-500/15 text-pink-300',

    ];

    const length = firstName?.length ?? 0;

    return colors[length % colors.length];

};



const isPendingAccountSetup = (user: User) => user.requiredActions?.includes('UPDATE_PASSWORD') ?? false;



export const UsersTable: React.FC<UsersTableProps> = ({

    users,

    onEdit,

    onDelete,

    onResendInvitation,

    isResendingInvitation = false,

    resendingUserId = null,

}) => {

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

                                <div className="font-medium text-foreground">{`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username}</div>

                                <div className="text-muted-foreground text-xs">{user.email}</div>

                            </div>

                        </div>

                    ),

                },

                {

                    header: 'RÔLE',

                    accessor: (user) => {

                        const roleKey = user.role ?? 'User_Site';

                        const roleLabel = getRoleDisplayLabel(roleKey);

                        const isPrimary = roleKey === 'Admin_Site' || roleKey === 'Admin_Tenant';

                        return (

                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isPrimary

                                    ? 'bg-primary text-primary-foreground'

                                    : 'bg-primary/10 border border-primary/30 text-primary'

                                }`}>

                                {roleLabel}

                            </span>

                        );

                    },

                },

                {

                    header: 'STATUT',

                    accessor: (user) => {

                        const pendingSetup = isPendingAccountSetup(user);

                        return (

                            <span

                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pendingSetup

                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'

                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'

                                    }`}

                            >

                                {pendingSetup ? 'Invitation en attente' : 'Compte configuré'}

                            </span>

                        );

                    },

                },

                {

                    header: 'AGENCES ASSIGNÉES',

                    accessor: (user) => (

                        <div className="flex flex-wrap gap-2">

                            {(user.agencies ?? []).map((agency) => (

                                <span key={agency.id} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">

                                    {agency.name}

                                </span>

                            ))}

                        </div>

                    ),

                },

                {

                    header: 'ACTIONS',

                    accessor: (user) => (

                        <div className="flex items-center justify-end space-x-1">

                            <Tooltip label="Modifier">

                                <Button

                                    variant="ghost"

                                    size="sm"

                                    onClick={() => onEdit(user)}

                                    className="text-muted-foreground hover:text-foreground"

                                    aria-label={`Modifier ${user.email}`}

                                >

                                    <Pencil className="h-4 w-4" />

                                </Button>

                            </Tooltip>

                            <Tooltip label="Retirer l'accès">

                                <Button

                                    variant="ghost"

                                    size="sm"

                                    onClick={() => onDelete(user)}

                                    className="text-muted-foreground hover:text-red-400"

                                    aria-label={`Retirer ${user.email}`}

                                >

                                    <UserMinus className="h-4 w-4" />

                                </Button>

                            </Tooltip>

                            {isPendingAccountSetup(user) && (

                                <Tooltip label="Renvoyer l'invitation">

                                    <Button

                                        variant="ghost"

                                        size="sm"

                                        onClick={() => onResendInvitation(user)}

                                        className="text-muted-foreground hover:text-primary"

                                        disabled={isResendingInvitation && resendingUserId === user.id}

                                        aria-label={`Renvoyer l'invitation à ${user.email}`}

                                    >

                                        <Mail className="h-4 w-4" />

                                    </Button>

                                </Tooltip>

                            )}

                        </div>

                    ),

                    className: "text-right"

                }

            ]}

        />

    );

};
