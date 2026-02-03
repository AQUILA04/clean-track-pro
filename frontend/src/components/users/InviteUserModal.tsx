import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserService } from '@/services/user.service';
import { WashingMachine, X, ChevronDown } from 'lucide-react';

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const MOCK_AGENCIES = [
    { id: '1', name: 'Laverie Centre-Ville' },
    { id: '2', name: 'Pressing Nord' },
    { id: '3', name: 'Gare Sud' },
    { id: '4', name: 'Ouest Mall' },
];

export const InviteUserModal: React.FC<InviteUserModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('Admin_Site');
    const [selectedAgencies, setSelectedAgencies] = useState<{ id: string, name: string }[]>([]);
    const [agencyInput, setAgencyInput] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await UserService.inviteUser({
                email,
                role,
                agencyIds: selectedAgencies.map(a => a.id)
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to invite user');
        } finally {
            setLoading(false);
        }
    };

    const toggleAgency = (agencyId: string) => {
        const agency = MOCK_AGENCIES.find(a => a.id === agencyId);
        if (!agency) return;

        if (selectedAgencies.some(a => a.id === agencyId)) {
            setSelectedAgencies(selectedAgencies.filter(a => a.id !== agencyId));
        } else {
            setSelectedAgencies([...selectedAgencies, agency]);
            setAgencyInput('');
            setIsDropdownOpen(false);
        }
        inputRef.current?.focus();
    };

    // Filter available agencies
    const filteredAgencies = MOCK_AGENCIES.filter(
        agency =>
            !selectedAgencies.some(sa => sa.id === agency.id) &&
            agency.name.toLowerCase().includes(agencyInput.toLowerCase())
    );

    const handleInputFocus = () => {
        setIsDropdownOpen(true);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-[500px] p-8 relative">

                {/* Icon Header */}
                <div className="flex flex-col items-center justify-center mb-6">
                    <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center mb-4 text-white">
                        <WashingMachine className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 text-center">Inviter un nouvel utilisateur</h2>
                    <p className="text-sm text-gray-500 mt-1 text-center max-w-xs mx-auto">
                        Envoyez une invitation par e-mail pour rejoindre le réseau.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1.5">Adresse e-mail</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="exemple@domaine.fr"
                            required
                            className="bg-white border-gray-200"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-1.5">Rôle</label>
                        <div className="relative">
                            <select
                                className="w-full appearance-none rounded-lg border border-gray-200 py-2.5 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="Admin_Site">Admin_Site</option>
                                <option value="User_Site">User_Site</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <ChevronDown className="h-4 w-4" />
                            </div>
                        </div>
                    </div>

                    <div ref={dropdownRef} className="relative">
                        <label className="block text-sm font-semibold text-gray-800 mb-1.5">Agences assignées</label>
                        <div
                            className="rounded-lg border border-gray-200 px-3 py-2 min-h-[42px] bg-white transition-all focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 cursor-text"
                            onClick={() => inputRef.current?.focus()}
                        >
                            <div className="flex flex-wrap gap-2">
                                {selectedAgencies.map(agency => (
                                    <span key={agency.id} className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                                        {agency.name}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleAgency(agency.id);
                                            }}
                                            className="ml-1.5 text-blue-400 hover:text-blue-600 focus:outline-none"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder-gray-400 py-0.5"
                                    placeholder={selectedAgencies.length === 0 ? "Ajouter une agence..." : ""}
                                    value={agencyInput}
                                    onChange={(e) => setAgencyInput(e.target.value)}
                                    onFocus={handleInputFocus}
                                />
                            </div>
                        </div>

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 border border-gray-200 rounded-lg shadow-lg bg-white max-h-40 overflow-y-auto z-20">
                                {filteredAgencies.length > 0 ? (
                                    filteredAgencies.map(agency => (
                                        <div
                                            key={agency.id}
                                            className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                                            onClick={() => toggleAgency(agency.id)}
                                        >
                                            <span>{agency.name}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-3 py-2 text-sm text-gray-500 italic text-center">
                                        Aucune agence trouvée
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col space-y-3 mt-8 pt-2">
                        <Button
                            type="submit"
                            isLoading={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-lg"
                        >
                            Envoyer l'invitation
                        </Button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2.5 rounded-lg transition-colors"
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
