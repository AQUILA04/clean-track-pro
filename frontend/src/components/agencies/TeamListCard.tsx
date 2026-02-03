import React from 'react';
import { UserPlus } from 'lucide-react';

interface TeamMember {
    id: string;
    name: string;
    role: 'Admin_Site' | 'User_Site';
    initials: string;
}

interface TeamListCardProps {
    members: TeamMember[];
}

export const TeamListCard: React.FC<TeamListCardProps> = ({ members }) => {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col">
            <div className="p-6 pb-2 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Équipe de l'agence</h3>
                <button className="text-primary hover:bg-blue-50 p-2 rounded-full transition-colors">
                    <UserPlus size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
                <div className="border-b border-gray-100 flex py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <span className="w-1/2">Membre</span>
                    <span className="w-1/2">Rôle</span>
                </div>

                <ul className="divide-y divide-gray-100">
                    {members.map((member) => (
                        <li key={member.id} className="py-4 flex items-center">
                            <div className="flex items-center w-1/2 gap-3">
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${member.id === '1' ? 'bg-blue-100 text-primary' :
                                        member.id === '2' ? 'bg-purple-100 text-purple-600' :
                                            member.id === '3' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-600'
                                    }`}>
                                    {member.initials}
                                </div>
                                <span className="text-sm font-semibold text-gray-900">{member.name}</span>
                            </div>
                            <div className="w-1/2">
                                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                                    {member.role}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                <button className="w-full text-center text-sm font-semibold text-primary hover:text-blue-700 transition-colors">
                    Voir toute l'équipe
                </button>
            </div>
        </div>
    );
};
