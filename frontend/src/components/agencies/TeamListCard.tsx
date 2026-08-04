import React from 'react';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { getRoleDisplayLabel } from '@/lib/roles';

interface TeamMember {
    id: string;
    name: string;
    role: string;
    initials: string;
}

interface TeamListCardProps {
    members: TeamMember[];
    siteId?: string;
}

const AVATAR_STYLES = [
    'bg-primary/15 text-primary',
    'bg-violet-500/15 text-violet-400',
    'bg-muted text-muted-foreground',
    'bg-amber-500/15 text-amber-400',
];

export const TeamListCard: React.FC<TeamListCardProps> = ({ members, siteId }) => {
    const usersHref = siteId ? `/users?siteId=${siteId}` : '/users';

    return (
        <div className="bg-card rounded-xl border border-border h-full flex flex-col">
            <div className="p-6 pb-2 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-foreground">Équipe de l&apos;agence</h3>
                <Link
                    href={usersHref}
                    className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors duration-150"
                    aria-label="Ajouter un membre"
                >
                    <UserPlus size={20} />
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
                <div className="border-b border-border flex py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <span className="w-1/2">Membre</span>
                    <span className="w-1/2">Rôle</span>
                </div>

                {members.length === 0 ? (
                    <p className="py-8 text-sm text-muted-foreground text-center">
                        Aucun membre assigné à cette agence.
                    </p>
                ) : (
                    <ul className="divide-y divide-border">
                        {members.map((member, index) => (
                            <li key={member.id} className="py-4 flex items-center hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors duration-150">
                                <div className="flex items-center w-1/2 gap-3 min-w-0">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                            AVATAR_STYLES[index % AVATAR_STYLES.length]
                                        }`}
                                    >
                                        {member.initials}
                                    </div>
                                    <span className="text-sm font-semibold text-foreground truncate">
                                        {member.name}
                                    </span>
                                </div>
                                <div className="w-1/2">
                                    <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                                        {getRoleDisplayLabel(member.role)}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="p-4 border-t border-border rounded-b-xl">
                <Link
                    href={usersHref}
                    className="block w-full text-center text-sm font-semibold text-primary hover:text-blue-400 transition-colors duration-150"
                >
                    Voir toute l&apos;équipe
                </Link>
            </div>
        </div>
    );
};
