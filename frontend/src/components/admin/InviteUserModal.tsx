import { useState, useEffect } from 'react';
import { SiteService } from '@/services/site.service';
import { UserService } from '@/services/user.service';

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function InviteUserModal({ isOpen, onClose, onSuccess }: InviteUserModalProps) {
    const [email, setEmail] = useState('');
    const [siteId, setSiteId] = useState('');
    const [sites, setSites] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchSites();
            setEmail('');
            setSiteId('');
            setError('');
        }
    }, [isOpen]);

    const fetchSites = async () => {
        try {
            const data = await SiteService.getAll();
            setSites(data);
        } catch (err) {
            console.error('Failed to fetch sites', err);
            setError('Failed to load sites.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await UserService.inviteUser({
                email,
                role: 'Admin_Site',
                siteId
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError('Failed to invite user.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                <h3 className="text-lg font-bold mb-4">Inviter un Manager d&apos;agence</h3>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full border p-2 rounded focus:ring-2 focus:ring-[#1A5AD7] outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Target Site</label>
                        <select
                            required
                            className="w-full border p-2 rounded focus:ring-2 focus:ring-[#1A5AD7] outline-none"
                            value={siteId}
                            onChange={(e) => setSiteId(e.target.value)}
                        >
                            <option value="">Select a Site</option>
                            {sites.map(site => (
                                <option key={site.id} value={site.id}>{site.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-[#1A5AD7] text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Sending...' : 'Send Invitation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
