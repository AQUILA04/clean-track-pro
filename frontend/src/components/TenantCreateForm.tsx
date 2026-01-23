'use client';

import { useState } from 'react';
import { TenantService } from '../services/tenant.service';
import { useRouter } from 'next/navigation';

export default function TenantCreateForm() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        subdomain: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await TenantService.create(formData);
            setSuccess('Tenant created successfully!');
            setFormData({ name: '', subdomain: '' });
            // In a real app, you might redirect after a short delay
            setTimeout(() => {
                // router.push('/admin/tenants');
            }, 2000);
        } catch (err) {
            setError('Failed to create tenant. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Tenant</h2>

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Agency Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div>
                    <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 mb-1">
                        Subdomain
                    </label>
                    <input
                        type="text"
                        id="subdomain"
                        required
                        pattern="[a-zA-Z0-9-]+"
                        title="Alphanumeric characters and hyphens only"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.subdomain}
                        onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Expected URL: {formData.subdomain ? `${formData.subdomain}.cleantrack.pro` : '...'}
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                >
                    {loading ? 'Creating...' : 'Create Tenant'}
                </button>
            </form>
        </div>
    );
}
