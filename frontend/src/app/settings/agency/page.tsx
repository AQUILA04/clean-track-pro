
'use client';

import { useState, useEffect } from 'react';
import { TenantService, UpdateTenantBrandingDto } from '@/services/tenant.service';
import { UserService } from '@/services/user.service';
import InviteUserModal from '@/components/admin/InviteUserModal';
import { PageLoader } from '@/components/ui/loading';

export default function AgencySettingsPage() {
    const [loading, setLoading] = useState(true);
    const [brandingForm, setBrandingForm] = useState<UpdateTenantBrandingDto>({ name: '', logoUrl: '' });
    const [users, setUsers] = useState<any[]>([]);

    // Invitation Form State
    const [showInviteModal, setShowInviteModal] = useState(false);

    useEffect(() => {
        // Fetch initial data
        const init = async () => {
            try {
                await Promise.all([fetchTenant(), fetchUsers()]);
            } catch (error) {
                console.error('Initialization error:', error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const fetchTenant = async () => {
        try {
            const tenant = await TenantService.getCurrentTenant();
            setBrandingForm({
                name: tenant.name,
                logoUrl: tenant.logoUrl || ''
            });
        } catch (error) {
            console.error('Failed to fetch tenant details', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const data = await UserService.getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };


    const handleBrandingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await TenantService.updateBranding(brandingForm);
            alert('Branding updated successfully');
        } catch (error) {
            alert('Failed to update branding');
            console.error(error);
        }
    };

    const handleInviteSuccess = () => {
        alert('User invited successfully');
        fetchUsers();
    };

    if (loading) return <PageLoader label="Chargement des paramètres…" />;

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8 text-[#1A5AD7]">Agency Settings</h1>

            {/* Branding Section */}
            <section className="bg-white p-6 rounded-lg shadow mb-8">
                <h2 className="text-xl font-semibold mb-4 border-b pb-2">Agency Branding</h2>
                <form onSubmit={handleBrandingSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Agency Name</label>
                        <input
                            type="text"
                            className="w-full border p-2 rounded"
                            value={brandingForm.name || ''}
                            onChange={(e) => setBrandingForm({ ...brandingForm, name: e.target.value })}
                            placeholder="My Agency Name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Logo URL</label>
                        <input
                            type="text"
                            className="w-full border p-2 rounded"
                            value={brandingForm.logoUrl || ''}
                            onChange={(e) => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                            placeholder="https://example.com/logo.png"
                        />
                    </div>
                    <button type="submit" className="bg-[#1A5AD7] text-white px-4 py-2 rounded hover:bg-blue-700">
                        Save Branding
                    </button>
                </form>
            </section>

            {/* User Management Section */}
            <section className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-xl font-semibold">Team Management</h2>
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                        + Invite User
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="p-3">Email</th>
                                <th className="p-3">Username</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Site IDs</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td className="p-3">{user.email}</td>
                                    <td className="p-3">{user.username}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs ${user.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.enabled ? 'Active' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-sm text-gray-500">
                                        {user.attributes?.site_ids?.join(', ') || '-'}
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-4 text-center text-gray-400">No users found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Invite Modal */}
            <InviteUserModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                onSuccess={handleInviteSuccess}
            />
        </div>
    );
}
